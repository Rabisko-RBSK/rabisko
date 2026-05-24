package com.rabisko.mvp.infraestrutura.websocket;

import com.rabisko.mvp.infraestrutura.security.TokenService;
import com.rabisko.mvp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

// =====================================================================
// INTERCEPTOR JwtChannelInterceptor — autentica conexoes WebSocket via JWT.
//
// Esse interceptor "espia" toda mensagem STOMP que chega no servidor.
// Trata duas situacoes:
//
//   1) STOMP CONNECT  (handshake inicial — primeiro frame depois do
//      upgrade pra WebSocket)
//        Le o header `Authorization: Bearer <jwt>`, valida o token,
//        carrega o User e marca a SESSAO como autenticada.
//        Se algo der errado, lanca excecao — o frame nunca segue, o
//        cliente recebe um CONNECT failure.
//
//   2) STOMP SEND     (mensagem que o cliente esta tentando enviar)
//        Bloqueia tentativas de publicar DIRETO em /topic ou /queue.
//        Esses dois prefixos sao reservados pra o BROKER, nunca pro
//        cliente. O caminho legitimo e enviar pra /app/... que entao
//        e tratado por um @MessageMapping no backend (que decide se
//        e quem repassa pro broker).
//
// Por que NAO usar o SecurityFilter do HTTP aqui?
//   Porque WebSocket nao e HTTP — quando a conexao "vira" WebSocket
//   depois do handshake, os filtros HTTP nao rodam mais. Precisamos
//   de um interceptor proprio do canal STOMP.
// =====================================================================

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    /**
     * preSend roda ANTES de cada mensagem ser entregue ao destino.
     * E o ponto onde a gente "inspeciona" e decide se autentica/bloqueia.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // Acessor que da uma view tipada do header STOMP (comando, headers, etc).
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        // Caso 1: handshake inicial — autentica
        if (StompCommand.CONNECT.equals(command)) {
            autenticarConexao(accessor);
        }

        // Caso 2: envio — bloqueia destinos reservados
        if (StompCommand.SEND.equals(command)) {
            bloquearPublicacaoDireta(accessor);
        }

        return message;   // segue normalmente pro broker/handler
    }

    /**
     * Valida o JWT que veio no STOMP CONNECT, carrega o User e marca
     * a sessao como autenticada. Lanca excecao se token ausente/invalido,
     * o que faz o frame CONNECT ser rejeitado.
     */
    private void autenticarConexao(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("WebSocket sem token de autenticacao");
        }

        String token = authHeader.replace("Bearer ", "");
        String email = tokenService.validateToken(token);

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Token JWT invalido ou expirado");
        }

        UserDetails user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Usuario nao encontrado");
        }

        // Cria o Authentication e amarra na sessao STOMP. Esse e o
        // "simpUser" que aparece nos headers da mensagem dali pra frente.
        var auth = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities()
        );
        accessor.setUser(auth);
    }

    /**
     * Impede que o cliente publique diretamente em /topic/X ou /queue/X.
     * Esses sao destinos do broker — quem publica neles e o servidor,
     * via convertAndSend. O cliente deve sempre mandar pra /app/...
     * (que vai cair em algum @MessageMapping nosso).
     */
    private void bloquearPublicacaoDireta(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination != null
                && (destination.startsWith("/topic") || destination.startsWith("/queue"))) {
            throw new IllegalArgumentException(
                    "Publicacao direta em /topic ou /queue nao permitida. Use /app/..."
            );
        }
    }
}
