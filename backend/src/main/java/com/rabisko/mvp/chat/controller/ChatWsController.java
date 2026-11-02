package com.rabisko.mvp.chat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.rabisko.mvp.chat.domain.EnviarMensagemRequest;
import com.rabisko.mvp.chat.service.ChatService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;


@Controller
public class ChatWsController {

    @Autowired
    private ChatService chatService;

    /**
     * Recebe o Authentication, não `@AuthenticationPrincipal UsuarioLogado`: em
     * @MessageMapping, o resolver nativo de java.security.Principal roda antes
     * do @AuthenticationPrincipal e, como UsuarioLogado é um Principal, injetaria
     * o token inteiro no parâmetro ("argument type mismatch").
     */
    @MessageMapping("/chat.send")
    public void enviarMensagem(Authentication auth, @Payload EnviarMensagemRequest req) {
        chatService.enviarMensagem((UsuarioLogado) auth.getPrincipal(), req.chatId(), req);
    }
}
