package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.artist.Artist;
import com.rabisko.mvp.domain.chat.AbrirChatRequest;
import com.rabisko.mvp.domain.chat.Chat;
import com.rabisko.mvp.domain.chat.ChatDTO;
import com.rabisko.mvp.domain.client.Client;
import com.rabisko.mvp.domain.message.EnviarMensagemRequest;
import com.rabisko.mvp.domain.message.MensagemDTO;
import com.rabisko.mvp.domain.message.Message;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.domain.user.UserRole;
import com.rabisko.mvp.repositories.*;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;   // ← do Spring, não do nio
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired private ChatRepository chatRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    public ChatDTO abrirOuObterChat(User logado, AbrirChatRequest req) {
        UUID clienteId;
        UUID tatuadorId;
        UUID outroUserId;

        if (logado.getRole() == UserRole.cliente) {
            Client meuPerfil = clientRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));
            Artist outro = artistRepository.findById(req.outroPerfilId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));

            clienteId = meuPerfil.getClientId();
            tatuadorId = outro.getTatuadorId();
            outroUserId = outro.getUserId();

        } else if (logado.getRole() == UserRole.tatuador) {
            Artist meuPerfil = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
            Client outro = clientRepository.findById(req.outroPerfilId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

            clienteId = outro.getClientId();
            tatuadorId = meuPerfil.getTatuadorId();
            outroUserId = outro.getUserId();

        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        Chat chat = chatRepository.findByClienteIdAndTatuadorId(clienteId, tatuadorId)
            .orElseGet(() -> chatRepository.save(
                Chat.builder()
                    .clienteId(clienteId)
                    .tatuadorId(tatuadorId)
                    .ativo(true)
                    .build()
            ));

        String outroNome = userRepository.findById(outroUserId)
            .map(u -> ((User) u).getNome())
            .orElse("Usuário");
        Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chat.getChatId());

        return new ChatDTO(
            chat.getChatId(),
            outroUserId,
            outroNome,
            ultima.map(Message::getConteudo).orElse(null),
            ultima.map(Message::getDataEnvio).orElse(null),
            chat.isAtivo()
        );
    }

    public List<ChatDTO> listarChatsDoUsuario(User logado){
        List<ChatDTO> listaChats = new ArrayList<>();
        if (logado.getRole() == UserRole.cliente) {
            Client meuPerfil = clientRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            List<Chat> chats = chatRepository.findByClienteId(meuPerfil.getClientId());

            for(int i = 0; i < chats.size(); i++){
                Artist outro = artistRepository.findById(chats.get(i).getTatuadorId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
                User outroUser = userRepository.findById(outro.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());
                ChatDTO c = new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getUserId(),
                    outroUser.getNome(),
                    ultima.map(Message::getConteudo).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                );

                listaChats.add(c);
            }
        } else if (logado.getRole() == UserRole.tatuador) {
            Artist meuPerfil = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil artista não encontrado"));

            List<Chat> chats = chatRepository.findByTatuadorId(meuPerfil.getTatuadorId());

            for(int i = 0; i < chats.size(); i++){
                Client outro = clientRepository.findById(chats.get(i).getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
                User outroUser = userRepository.findById(outro.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());
                ChatDTO c = new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getUserId(),
                    outroUser.getNome(),
                    ultima.map(Message::getConteudo).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                );

                listaChats.add(c);
            }
        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        return listaChats;
    }

    public Page<MensagemDTO> listarMensagens(User logado, UUID chatId, Pageable pagina){
        Chat chat = chatRepository.findById(chatId)
          .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);
        return messageRepository.findByChatIdOrderByDataEnvioDesc(chatId, pagina)
            .map(m -> new MensagemDTO(
                m.getMensagemId(), m.getChatId(),
                m.getRemetenteId(), m.getDestinatarioId(),
                m.getConteudo(), m.getDataEnvio()
            ));
    }

    public MensagemDTO enviarMensagem(User logado, UUID chatId, EnviarMensagemRequest req){

        
        Chat chat = chatRepository.findById(chatId)
          .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
          
        garantirParticipacao(logado, chat);

        UUID remetenteId = logado.getUserId();
        UUID destinatarioId;

        if (logado.getRole() == UserRole.cliente) {
            Artist outroPerfil = artistRepository.findById(chat.getTatuadorId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));

            destinatarioId = outroPerfil.getUserId();

        } else if (logado.getRole() == UserRole.tatuador) {
            Client outroPerfil = clientRepository.findById(chat.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
                
            destinatarioId = outroPerfil.getUserId();
        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        Message salva = messageRepository.save(Message.builder()
            .chatId(chatId)
            .remetenteId(remetenteId)
            .destinatarioId(destinatarioId)
            .conteudo(req.conteudo())
            .build());

        User destinatario = (User) userRepository.findById(destinatarioId)
            .orElseThrow(() -> new EntityNotFoundException("Usuário destinatário não encontrado"));

        MensagemDTO dto = new MensagemDTO(salva.getMensagemId(), chatId, remetenteId, destinatarioId,
            salva.getConteudo(), salva.getDataEnvio());

        messagingTemplate.convertAndSendToUser(destinatario.getEmail(), "/queue/messages", dto);

        return dto;
    }

    private void garantirParticipacao(User user, Chat chat) {
      if (user.getRole() == UserRole.cliente) {
          Client meuPerfil = clientRepository.findByUserId(user.getUserId())
              .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

          if (!chat.getClienteId().equals(meuPerfil.getClientId()))
              throw new AccessDeniedException("Você não participa deste chat");

      } else if (user.getRole() == UserRole.tatuador) {
          Artist meuPerfil = artistRepository.findByUserId(user.getUserId())
              .orElseThrow(() -> new EntityNotFoundException("Perfil artista não encontrado"));

          if (!chat.getTatuadorId().equals(meuPerfil.getTatuadorId()))
              throw new AccessDeniedException("Você não participa deste chat");
      } else {
          throw new AccessDeniedException("Esse papel não participa de chat");
      }
  }
}