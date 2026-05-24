package com.rabisko.mvp.domain.message;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// =====================================================================
// DTO EnviarMensagemRequest — entrada quando o usuario manda mensagem.
//
// Usado em DUAS rotas:
//   1) REST: POST /chats/{id}/mensagens (com chatId redundante)
//   2) WebSocket: SEND /app/chat.send (handler em ChatWsController)
//
// Validacoes:
//   @NotNull em chatId      : sem chat, nao da pra enviar
//   @NotBlank em conteudo   : nao aceita mensagem vazia
//   @Size(max=2000)         : limite de tamanho pra evitar abuso/spam
//
// O REMETENTE nao vem aqui — vem do JWT (@AuthenticationPrincipal).
// Isso impede que alguem envie uma mensagem se passando por outro.
// =====================================================================
public record EnviarMensagemRequest(
    @NotNull
    UUID chatId,

    @NotBlank
    @Size(max = 2000)
    String conteudo
  ) {}
