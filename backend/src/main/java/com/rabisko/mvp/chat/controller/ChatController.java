package com.rabisko.mvp.chat.controller;

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

import com.rabisko.mvp.chat.domain.AbrirChatRequest;
import com.rabisko.mvp.chat.domain.ChatDTO;
import com.rabisko.mvp.chat.domain.MensagemDTO;
import com.rabisko.mvp.chat.service.ChatService;
import com.rabisko.mvp.user.domain.User;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/chats")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * POST /chats — abre um chat com outro usuario (ou devolve o
     * existente, se o par ja conversou antes).
     */
    @PostMapping
    public ChatDTO abrirOuObterChat(
            @AuthenticationPrincipal User usuario,
            @RequestBody @Valid AbrirChatRequest request) {
        return chatService.abrirOuObterChat(usuario, request);
    }

    /**
     * GET /chats — lista de conversas do usuario logado.
     * Cada item tem nome do outro lado e preview da ultima mensagem
     * (igual a tela inicial do WhatsApp).
     */
    @GetMapping
    public List<ChatDTO> listarChatsDoUsuario(@AuthenticationPrincipal User usuario) {
        return chatService.listarChatsDoUsuario(usuario);
    }

    /**
     * GET /chats/{chatId}/mensagens?page=0&size=30
     *
     * Historico paginado das mensagens de um chat especifico.
     *
     *   @PathVariable UUID chatId : pega o pedaco {chatId} da URL
     *   @RequestParam page/size   : query params com defaults
     *
     * Page<MensagemDTO> e o tipo do Spring Data pra resposta paginada;
     * o JSON resultante traz `content`, `totalElements`, `number`, etc.
     */
    @GetMapping("/{chatId}/mensagens")
    public Page<MensagemDTO> historicoChat(
            @AuthenticationPrincipal User usuario,
            @PathVariable UUID chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return chatService.listarMensagens(usuario, chatId, PageRequest.of(page, size));
    }
}
