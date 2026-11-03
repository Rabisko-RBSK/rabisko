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

    @MessageMapping("/chat.send")
    public void enviarMensagem(Authentication auth, @Payload EnviarMensagemRequest req) {
        chatService.enviarMensagem((UsuarioLogado) auth.getPrincipal(), req.chatId(), req);
    }
}
