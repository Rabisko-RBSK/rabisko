package com.rabisko.mvp.shared.infraestrutura.websocket;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.messaging.context.AuthenticationPrincipalArgumentResolver;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private JwtChannelInterceptor jwtChannelInterceptor;

    /**
     * Registra o endpoint TCP-like onde o cliente conecta inicialmente.
     * `withSockJS()` adiciona um fallback pra clientes que nao tem
     * WebSocket nativo (browsers antigos, redes restritivas).
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/wss")
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    /**
     * Configura o BROKER de mensagens (quem roteia o que pra quem).
     *
     *   enableSimpleBroker("/topic","/queue") : usa broker em memoria
     *       pros prefixos /topic e /queue. Pra producao com varias
     *       instancias do servidor, trocar por RabbitMQ/ActiveMQ.
     *
     *   setApplicationDestinationPrefixes("/app") : mensagens enviadas
     *       pelo cliente pra /app/* sao roteadas pros handlers
     *       @MessageMapping no backend.
     *
     *   setUserDestinationPrefix("/user") : ativa o atalho
     *       convertAndSendToUser pra entrega 1-a-1.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Configura interceptors no canal de ENTRADA (mensagens vindas do cliente).
     *
     * Ordem importa:
     *   1) jwtChannelInterceptor — valida o JWT no CONNECT, seta o "user"
     *      da sessao STOMP, e bloqueia publicacao direta em /topic|/queue.
     *   2) SecurityContextChannelInterceptor — copia o user da sessao
     *      pra dentro do SecurityContextHolder da thread, pra que o
     *      @AuthenticationPrincipal funcione nos handlers.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor, new SecurityContextChannelInterceptor());
    }

    /**
     * Registra o resolver que faz @AuthenticationPrincipal funcionar
     * nos handlers @MessageMapping (sem isso, o Spring tenta tratar o
     * parametro User como payload JSON da mensagem e quebra).
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver());
    }
}
