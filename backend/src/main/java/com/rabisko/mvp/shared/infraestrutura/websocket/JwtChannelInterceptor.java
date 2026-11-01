package com.rabisko.mvp.shared.infraestrutura.websocket;

import com.rabisko.mvp.shared.infraestrutura.security.SupabaseJwtConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.jwt.Jwt;


@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private SupabaseJwtConverter converter;

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
     * Valida o JWT do Supabase que veio no STOMP CONNECT (assinatura pelo
     * JWKS, expiracao e audience) e marca a sessao com o UsuarioLogado.
     * O nome do principal e o authId, usado pelo convertAndSendToUser.
     * Lanca excecao se token ausente/invalido, o que faz o frame CONNECT
     * ser rejeitado.
     */
    private void autenticarConexao(StompHeaderAccessor accessor) {

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("WebSocket sem token de autenticacao");
        }

        String token = authHeader.substring(7);

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(token);
        } catch (JwtException e) {
            throw new IllegalArgumentException("Token JWT invalido ou expirado");
        }

        accessor.setUser(converter.convert(jwt));

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
