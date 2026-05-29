package com.rabisko.mvp.chat.domain;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

// =====================================================================
// DTO AbrirChatRequest — entrada do POST /chats (abrir/encontrar chat).
//
// O front manda APENAS o id do outro perfil (o outro lado da conversa).
// Quem ESTA pedindo a abertura vem do JWT (@AuthenticationPrincipal),
// nao do payload — assim ninguem consegue abrir chat em nome de outro.
//
// "outroPerfilId" e o id da TABELA de perfil correspondente:
//   - cliente logado abre chat com tatuador -> outroPerfilId = tatuadorId
//   - tatuador logado abre chat com cliente -> outroPerfilId = clienteId
//
// O ChatService usa o role do usuario logado pra interpretar.
// =====================================================================
public record AbrirChatRequest(
    @NotNull
    UUID outroPerfilId
  ) {}
