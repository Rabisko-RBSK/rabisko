package com.rabisko.mvp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.rabisko.mvp.domain.message.EnviarMensagemRequest;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.service.ChatService;

@Controller
public class ChatWsController {

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.send")
    public void enviarMensagem(@AuthenticationPrincipal User logado, @Payload EnviarMensagemRequest req){
        chatService.enviarMensagem(logado, req.chatId(), req);
    }
}
