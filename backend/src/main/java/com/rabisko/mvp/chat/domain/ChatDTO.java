package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.util.UUID;

// =====================================================================
// DTO ChatDTO — item da lista de conversas (GET /chats).
//
// Diferente do que vai pro banco (entity Chat), aqui o foco e mostrar
// uma LINHA da tela "Minhas conversas" do usuario logado. Por isso os
// campos sao em perspectiva: "o OUTRO usuario do chat" (nao "cliente"
// nem "tatuador") — o ChatService monta o DTO traduzindo dependendo de
// quem esta logado.
//
//   outroUsuarioId       : id do interlocutor (cliente OU tatuador,
//                          depende de quem esta logado)
//   outroUsuarioNome     : nome dele (vem do `users` via JOIN)
//   ultimaMensagem       : texto da ultima mensagem trocada
//   dataUltimaMensagem   : timestamp pra ordenar/exibir "ha 5 min"
//   ativo                : se o chat esta ativo ou foi encerrado
// =====================================================================
public record ChatDTO(
    UUID chatId,
    UUID outroUsuarioId,
    String outroUsuarioNome,
    String ultimaMensagem,
    LocalDateTime dataUltimaMensagem,
    boolean ativo
) {}
