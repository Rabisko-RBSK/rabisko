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
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.user.domain.UserRole;
import com.rabisko.mvp.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// =====================================================================
// SERVICE ChatService — toda a logica do CHAT.
//
// Responsabilidades:
//   - abrirOuObterChat        : achar (ou criar) o chat unico entre 2 perfis
//   - listarChatsDoUsuario    : lista de conversas do usuario logado
//   - listarMensagens         : historico paginado de mensagens de um chat
//   - enviarMensagem          : persiste a mensagem E faz broadcast por WebSocket
//   - garantirParticipacao    : guarda de seguranca (usuario logado e do chat?)
//
// Observacoes importantes:
//
// 1) "outroPerfilId" e o id do PERFIL (clienteId/tatuadorId), nao do User.
//    A logica troca dependendo de quem esta logado:
//      - cliente logado: outroPerfilId = id em `tatuadores`
//      - tatuador logado: outroPerfilId = id em `clientes`
//
// 2) garantirParticipacao impede que A leia/envie em chat de B e C.
//    SEMPRE chamada antes de qualquer leitura/escrita.
//
// 3) Envio de mensagem dispara DUAS coisas:
//    a) save() no `mensagens`
//    b) convertAndSendToUser para destinatario E remetente
//       (o remetente tb recebe via WebSocket pra todas suas telas/dispositivos
//        sincronizarem na hora).
// =====================================================================

@Service
public class ChatService {

    @Autowired private ChatRepository chatRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private UserRepository userRepository;

    // SimpMessagingTemplate = "mensageiro" do Spring pra enviar via STOMP/WebSocket.
    // O metodo convertAndSendToUser(email, destino, payload) entrega so pro usuario
    // identificado por aquele email (que e o "username" da sessao STOMP).
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // ==================================================================
    // ABRIR / OBTER CHAT
    // ==================================================================

    /**
     * Devolve o chat existente entre os dois perfis. Se nao existir, cria.
     * A UNIQUE em (cliente_id, tatuador_id) no banco garante 1 chat unico
     * por par — esse metodo nunca cria duplicado.
     */
    public ChatDTO abrirOuObterChat(User logado, AbrirChatRequest req) {
        UUID clienteId;
        UUID tatuadorId;
        UUID outroUserId;       // userId do interlocutor, pra montar o DTO

        // Resolve quem e cliente e quem e tatuador no chat, dependendo de quem esta logado.
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
            // Admin e estudio nao participam de chat 1-pra-1.
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        // Busca o chat existente; se nao existir, cria.
        Chat chat = chatRepository.findByClienteIdAndTatuadorId(clienteId, tatuadorId)
            .orElseGet(() -> chatRepository.save(
                Chat.builder()
                    .clienteId(clienteId)
                    .tatuadorId(tatuadorId)
                    .ativo(true)
                    .build()
            ));

        // Pega o nome do outro e a ultima mensagem (pra preencher o DTO).
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

    // ==================================================================
    // LISTAR CHATS DO USUARIO
    // ==================================================================

    /**
     * Devolve a lista de chats do usuario logado, com o nome do outro
     * lado e um preview da ultima mensagem. Igual ao WhatsApp "lista
     * de conversas".
     */
    public List<ChatDTO> listarChatsDoUsuario(User logado){
        List<ChatDTO> listaChats = new ArrayList<>();

        if (logado.getRole() == UserRole.cliente) {
            Client meuPerfil = clientRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            List<Chat> chats = chatRepository.findByClienteId(meuPerfil.getClientId());

            for (int i = 0; i < chats.size(); i++) {
                // Pra cada chat, pega o tatuador (outro lado) + dados do User dele
                Artist outro = artistRepository.findById(chats.get(i).getTatuadorId())
                    .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
                User outroUser = userRepository.findById(outro.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());

                listaChats.add(new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getUserId(),
                    outroUser.getNome(),
                    ultima.map(Message::getConteudo).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                ));
            }
        } else if (logado.getRole() == UserRole.tatuador) {
            // Mesma logica do bloco acima, mas para tatuador (o outro lado e cliente).
            Artist meuPerfil = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil artista não encontrado"));

            List<Chat> chats = chatRepository.findByTatuadorId(meuPerfil.getTatuadorId());

            for (int i = 0; i < chats.size(); i++) {
                Client outro = clientRepository.findById(chats.get(i).getClienteId())
                    .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
                User outroUser = userRepository.findById(outro.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

                Optional<Message> ultima = messageRepository.findTopByChatIdOrderByDataEnvioDesc(chats.get(i).getChatId());

                listaChats.add(new ChatDTO(
                    chats.get(i).getChatId(),
                    outro.getUserId(),
                    outroUser.getNome(),
                    ultima.map(Message::getConteudo).orElse(null),
                    ultima.map(Message::getDataEnvio).orElse(null),
                    chats.get(i).isAtivo()
                ));
            }
        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        return listaChats;
    }

    // ==================================================================
    // LISTAR MENSAGENS DE UM CHAT (historico paginado)
    // ==================================================================

    public Page<MensagemDTO> listarMensagens(User logado, UUID chatId, Pageable pagina){
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);    // bloqueia bisbilhotagem

        return messageRepository.findByChatIdOrderByDataEnvioDesc(chatId, pagina)
            .map(m -> new MensagemDTO(
                m.getMensagemId(), m.getChatId(),
                m.getRemetenteId(), m.getDestinatarioId(),
                m.getConteudo(), m.getDataEnvio()
            ));
    }

    // ==================================================================
    // ENVIAR MENSAGEM (persiste + broadcast WebSocket)
    // ==================================================================

    public MensagemDTO enviarMensagem(User logado, UUID chatId, EnviarMensagemRequest req){
        // 1) Carrega o chat e checa se o usuario logado pertence a ele
        Chat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));
        garantirParticipacao(logado, chat);

        // 2) Define quem e remetente (eu) e quem e destinatario (o outro)
        UUID remetenteId = logado.getUserId();
        UUID destinatarioId;

        if (logado.getRole() == UserRole.cliente) {
            // Cliente esta mandando -> destinatario e o tatuador
            Artist outroPerfil = artistRepository.findById(chat.getTatuadorId())
                .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
            destinatarioId = outroPerfil.getUserId();

        } else if (logado.getRole() == UserRole.tatuador) {
            // Tatuador esta mandando -> destinatario e o cliente
            Client outroPerfil = clientRepository.findById(chat.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
            destinatarioId = outroPerfil.getUserId();

        } else {
            throw new AccessDeniedException("Esse papel não participa de chat");
        }

        // 3) Salva a mensagem
        Message salva = messageRepository.save(Message.builder()
            .chatId(chatId)
            .remetenteId(remetenteId)
            .destinatarioId(destinatarioId)
            .conteudo(req.conteudo())
            .build());

        // 4) Pega o User destinatario pra usar o email como rota WebSocket
        User destinatario = (User) userRepository.findById(destinatarioId)
            .orElseThrow(() -> new EntityNotFoundException("Usuário destinatário não encontrado"));

        MensagemDTO dto = new MensagemDTO(
            salva.getMensagemId(), chatId, remetenteId, destinatarioId,
            salva.getConteudo(), salva.getDataEnvio()
        );

        // 5) Broadcast WebSocket:
        //    - Destinatario recebe a mensagem em tempo real
        //    - Remetente tb recebe (pra sincronizar entre dispositivos —
        //      mesmo usuario logado no celular E no web, por ex.)
        messagingTemplate.convertAndSendToUser(destinatario.getEmail(), "/queue/messages", dto);
        messagingTemplate.convertAndSendToUser(logado.getEmail(), "/queue/messages", dto);

        return dto;
    }

    // ==================================================================
    // GUARDA DE SEGURANCA
    // ==================================================================

    /**
     * Checa se o usuario logado realmente faz parte do chat (e o cliente
     * ou o tatuador dele). Se nao for, lanca AccessDeniedException → 403.
     *
     * Sem essa checagem, qualquer um com o chatId conseguiria ler/enviar
     * mensagens em chat alheio.
     */
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
