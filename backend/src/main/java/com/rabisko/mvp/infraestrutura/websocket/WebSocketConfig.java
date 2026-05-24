package com.rabisko.mvp.infraestrutura.websocket;

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

// =====================================================================
// CONFIG WebSocketConfig — config do CHAT em tempo real (STOMP/WebSocket).
//
// Conceitos importantes:
//
//   WebSocket
//     Protocolo que mantem uma conexao ABERTA entre cliente e servidor,
//     permitindo enviar mensagens nos 2 sentidos a qualquer momento (ao
//     contrario de HTTP, que e request-response).
//
//   STOMP (Simple Text Oriented Messaging Protocol)
//     Roda em cima do WebSocket. Da uma estrutura tipo "topicos" e
//     "filas" pra organizar quem manda e quem recebe.
//
//   Prefixos do nosso projeto:
//     /wss        : endpoint de conexao inicial (handshake)
//     /app/...    : pra onde o CLIENTE envia mensagens (server-bound)
//                   ex: /app/chat.send -> tratado em ChatWsController
//     /topic/...  : broadcast PUBLICO (todos inscritos recebem)
//     /queue/...  : entrega PRIVADA (so 1 usuario recebe)
//     /user/...   : prefixo especial pra entrega individual; quando
//                   chamamos convertAndSendToUser(email, "/queue/x", ...),
//                   o Spring traduz pra /user/<email>/queue/x.
//
// Como a SEGURANCA funciona no nosso chat:
//   1) O cliente abre WebSocket e manda um STOMP CONNECT com
//      Authorization: Bearer <jwt> no header.
//   2) JwtChannelInterceptor valida o JWT e seta o "user" da sessao.
//   3) SecurityContextChannelInterceptor copia esse user pro
//      SecurityContextHolder antes do handler rodar.
//   4) AuthenticationPrincipalArgumentResolver permite injetar
//      @AuthenticationPrincipal User logado no handler.
//
// Sem essas 3 pecas conectadas, o @AuthenticationPrincipal vem null
// dentro dos handlers @MessageMapping.
// =====================================================================

@Configuration
@EnableWebSocketMessageBroker      // habilita o suporte a STOMP/WebSocket
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
                .setAllowedOriginPatterns("*")     // CORS: aceita qualquer origem (apertar em prod)
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
