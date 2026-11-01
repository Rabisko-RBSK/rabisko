package com.rabisko.mvp.chat.service;

import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.chat.domain.AbrirChatRequest;
import com.rabisko.mvp.chat.domain.Chat;
import com.rabisko.mvp.chat.domain.ChatDTO;
import com.rabisko.mvp.chat.domain.EnviarMensagemRequest;
import com.rabisko.mvp.chat.domain.MensagemDTO;
import com.rabisko.mvp.chat.domain.Message;
import com.rabisko.mvp.chat.repository.ChatRepository;
import com.rabisko.mvp.chat.repository.MessageRepository;
import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.shared.storage.StorageService;
import com.rabisko.mvp.studio.service.ContratoService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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
    @Autowired private StorageService storageService;
    @Autowired private ContratoService contratoService;

    @Autowired private SimpMessagingTemplate messagingTemplate;


    /**
     * Devolve o chat existente entre os dois perfis. Se nao existir, cria.
     * A UNIQUE em (cliente_id, tatuador_id) no banco garante 1 chat unico
     * por par — esse metodo nunca cria duplicado.
     */
    public ChatDTO abrirOuObterChat(UsuarioLogado logado, AbrirChatRequest req) {
        UUID clienteId;
        UUID tatuadorId;
        UUID outroAuthId;
        String outroNome;

        if ("cliente".equals(logado.papel())) {
            Client meuPerfil = clientRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));
            Artist outro = artistRepository.findById(req.outroPerfilId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));

            clienteId = meuPerfil.getClientId();
            tatuadorId = outro.getTatuadorId();
            outroAuthId = outro.getAuthId();
            outroNome = outro.getNome();

        } else if ("tatuador".equals(logado.papel())) {
            Artist meuPerfil = artistRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
            Client outro = clientRepository.findById(req.outroPerfilId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

            clienteId = outro.getClientId();
            tatuadorId = meuPerfil.getTatuadorId();
            outroAuthId = outro.getAuthId();
            outroNome = outro.getNome();

        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        Chat chat = chatRepository.findByClienteIdAndTatuadorId(clienteId, tatuadorId)
            .orElseGet(() -> criarChat(clienteId, tatuadorId));

        Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chat.getChatId());

        return new ChatDTO(
            chat.getChatId(),
            outroAuthId,
            outroNome,
            ultima.map(ChatService::preview).orElse(null),
            ultima.map(Message::getDataEnvio).orElse(null),
            chat.isAtivo()
        );
    }

    private Chat criarChat(UUID clienteId, UUID tatuadorId) {
        if (contratoService.estudioDeAtendimento(tatuadorId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Este tatuador ainda não atende em nenhum estúdio.");
        }
        
        return chatRepository.save(Chat.builder()
            .clienteId(clienteId)
            .tatuadorId(tatuadorId)
            .ativo(true)
            .build());
    }



    /**
     * Devolve a lista de chats do usuario logado, com o nome do outro
     * lado e um preview da ultima mensagem. Igual ao WhatsApp "lista
     * de conversas".
     */
    public List<ChatDTO> listarChatsDoUsuario(UsuarioLogado logado){
        List<ChatDTO> listaChats = new ArrayList<>();

        if ("cliente".equals(logado.papel())) {
            Client meuPerfil = clientRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            List<Chat> chats = chatRepository.findByClienteId(meuPerfil.getClientId());

            for (int i = 0; i < chats.size(); i++) {
                Artist outro = artistRepository.findById(chats.get(i).getTatuadorId())
                    .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());

                listaChats.add(new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getAuthId(),
                    outro.getNome(),
                    ultima.map(ChatService::preview).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                ));
            }
        } else if ("tatuador".equals(logado.papel())) {
            Artist meuPerfil = artistRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil artista não encontrado"));

            List<Chat> chats = chatRepository.findByTatuadorId(meuPerfil.getTatuadorId());

            for (int i = 0; i < chats.size(); i++) {
                Client outro = clientRepository.findById(chats.get(i).getClienteId())
                    .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());

                listaChats.add(new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getAuthId(),
                    outro.getNome(),
                    ultima.map(ChatService::preview).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                ));
            }
        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        return listaChats;
    }


    public Page<MensagemDTO> listarMensagens(UsuarioLogado logado, UUID chatId, Pageable pagina){
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);

        return messageRepository.findByChatIdOrderByDataEnvioDesc(chatId, pagina)
            .map(MensagemDTO::from);
    }


    public MensagemDTO enviarMensagem(UsuarioLogado logado, UUID chatId, EnviarMensagemRequest req){
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);

        return salvarEDistribuir(logado, chat, req.conteudo(), null);
    }


    /**
     * Envia uma imagem (com legenda opcional) no chat. O upload vai pro
     * Supabase Storage e a mensagem segue o mesmo caminho das de texto:
     * salva e entregue via WebSocket aos dois participantes.
     */
    public MensagemDTO enviarImagem(UsuarioLogado logado, UUID chatId, MultipartFile file, String legenda){
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);

        String contentType = file == null ? null : file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O arquivo enviado não é uma imagem.");
        }
        if (legenda != null && legenda.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Legenda maior que 2000 caracteres.");
        }

        String imagemUrl = storageService.uploadChat(file);
        String conteudo = (legenda == null || legenda.isBlank()) ? null : legenda.trim();

        return salvarEDistribuir(logado, chat, conteudo, imagemUrl);
    }


    /**
     * Mensagem enviada em nome do tatuador ao confirmar um agendamento.
     * O chamador já validou que o tatuador participa do chat.
     */
    public MensagemDTO enviarConfirmacaoAgendamento(UsuarioLogado tatuador, Chat chat, String conteudo) {
        return salvarEDistribuir(tatuador, chat, conteudo, null);
    }


    private MensagemDTO salvarEDistribuir(UsuarioLogado logado, Chat chat, String conteudo, String imagemUrl) {
        UUID chatId = chat.getChatId();
        UUID remetenteId = logado.authId();
        UUID destinatarioId;

        if ("cliente".equals(logado.papel())) {
            Artist outroPerfil = artistRepository.findById(chat.getTatuadorId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
            destinatarioId = outroPerfil.getAuthId();

        } else if ("tatuador".equals(logado.papel())) {
            Client outroPerfil = clientRepository.findById(chat.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
            destinatarioId = outroPerfil.getAuthId();

        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        Message salva = messageRepository.save(Message.builder()
            .chatId(chatId)
            .remetenteId(remetenteId)
            .destinatarioId(destinatarioId)
            .conteudo(conteudo)
            .imagemUrl(imagemUrl)
            .build());

        MensagemDTO dto = MensagemDTO.from(salva);

        Runnable distribuir = () -> {
            messagingTemplate.convertAndSendToUser(destinatarioId.toString(), "/queue/messages", dto);
            messagingTemplate.convertAndSendToUser(logado.getName(), "/queue/messages", dto);
        };

        // Dentro de uma transação (ex.: confirmação de agendamento), só entrega
        // depois do commit — se der rollback, a mensagem não chega a ninguém.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { distribuir.run(); }
            });
        } else {
            distribuir.run();
        }

        return dto;
    }


    /** Texto do preview na lista de conversas: legenda/texto, ou um marcador de imagem. */
    private static String preview(Message m) {
        if (m.getConteudo() != null && !m.getConteudo().isBlank()) return m.getConteudo();
        return m.getImagemUrl() != null ? "📷 Imagem" : null;
    }


    /**
     * Checa se o usuario logado realmente faz parte do chat (e o cliente
     * ou o tatuador dele). Se nao for, lanca AccessDeniedException → 403.
     *
     * Sem essa checagem, qualquer um com o chatId conseguiria ler/enviar
     * mensagens em chat alheio.
     */
    private void garantirParticipacao(UsuarioLogado user, Chat chat) {
        if ("cliente".equals(user.papel())) {
            Client meuPerfil = clientRepository.findByAuthId(user.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            if (!chat.getClienteId().equals(meuPerfil.getClientId()))
                throw new AccessDeniedException("Você não participa deste chat");

        } else if ("tatuador".equals(user.papel())) {
            Artist meuPerfil = artistRepository.findByAuthId(user.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil artista não encontrado"));

            if (!chat.getTatuadorId().equals(meuPerfil.getTatuadorId()))
                throw new AccessDeniedException("Você não participa deste chat");

        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }
    }
}
