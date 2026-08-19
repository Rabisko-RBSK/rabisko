package com.rabisko.mvp.shared.infraestrutura.websocket;

import com.rabisko.mvp.shared.infraestrutura.security.TokenService;
import com.rabisko.mvp.user.repository.UserRepository;
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
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            autenticarConexao(accessor);
        }

        if (StompCommand.SEND.equals(command)) {
            bloquearPublicacaoDireta(accessor);
        }

        return message;
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
