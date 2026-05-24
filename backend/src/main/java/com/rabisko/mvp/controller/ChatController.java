package com.rabisko.mvp.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rabisko.mvp.domain.chat.AbrirChatRequest;
import com.rabisko.mvp.domain.chat.ChatDTO;
import com.rabisko.mvp.domain.message.MensagemDTO;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.service.ChatService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/chats")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ChatDTO abrirOuObterChat(@AuthenticationPrincipal User usuario, @RequestBody @Valid AbrirChatRequest request){
        return chatService.abrirOuObterChat(usuario, request);
    }

    @GetMapping
    public List<ChatDTO> listarChatsDoUsuario(@AuthenticationPrincipal User usuario) {
        return chatService.listarChatsDoUsuario(usuario);
    }

    @GetMapping("/{chatId}/mensagens")
    public Page<MensagemDTO> historicoChat(
    @AuthenticationPrincipal User usuario,
    @PathVariable UUID chatId,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "30") int size) {
        return chatService.listarMensagens(usuario, chatId, PageRequest.of(page, size));
    }
}
