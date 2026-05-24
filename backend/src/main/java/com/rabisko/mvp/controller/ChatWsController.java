package com.rabisko.mvp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.rabisko.mvp.domain.message.EnviarMensagemRequest;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.service.ChatService;

// =====================================================================
// CONTROLLER ChatWsController — handler WebSocket pro envio de mensagens.
//
// Esse controller NAO atende HTTP — ele atende mensagens STOMP que
// chegam via WebSocket. Por isso usa @Controller (sem o "Rest") e
// @MessageMapping em vez de @PostMapping.
//
// Fluxo de uma mensagem em tempo real:
//
//   1) Cliente envia STOMP SEND pra /app/chat.send (com payload JSON
//      do EnviarMensagemRequest no body)
//   2) Spring roteia pra este handler (porque @MessageMapping("/chat.send"))
//   3) @AuthenticationPrincipal injeta o User logado (veio do JWT
//      validado no STOMP CONNECT pelo JwtChannelInterceptor)
//   4) @Payload injeta o JSON ja desserializado em EnviarMensagemRequest
//   5) Service salva a mensagem no banco E faz broadcast pelos canais
//      WebSocket dos dois lados
//
// Observacao importante (foi um bug em desenvolvimento):
//   Pra @AuthenticationPrincipal funcionar aqui no WebSocket precisamos
//   das 3 pecas configuradas em WebSocketConfig:
//     - JwtChannelInterceptor (autentica no CONNECT)
//     - SecurityContextChannelInterceptor (propaga pra thread)
//     - AuthenticationPrincipalArgumentResolver (injeta no parametro)
//   Sem isso, `logado` vem null.
// =====================================================================

@Controller
public class ChatWsController {

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void enviarMensagem(@AuthenticationPrincipal User logado, @Payload EnviarMensagemRequest req) {
        chatService.enviarMensagem(logado, req.chatId(), req);
    }
}
