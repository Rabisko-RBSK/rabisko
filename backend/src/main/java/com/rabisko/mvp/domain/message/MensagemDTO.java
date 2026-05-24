package com.rabisko.mvp.domain.message;

import java.time.LocalDateTime;
import java.util.UUID;

// =====================================================================
// DTO MensagemDTO — formato de uma mensagem trafegada pela API/WebSocket.
//
// Espelho leve da entity Message: tem os mesmos campos, mas e o que
// vai pro JSON. Mantemos um DTO separado pra evitar serializar campos
// internos no futuro (se a entity ganhar `lido`, `editado`, etc. e
// nao quisermos expor).
//
// Usado em dois lugares:
//   1) Resposta do POST /chats/{id}/mensagens (REST)
//   2) Payload broadcast via WebSocket pra /user/queue/messages
// =====================================================================
public record MensagemDTO(
      UUID mensagemId,
      UUID chatId,
      UUID remetenteId,
      UUID destinatarioId,
      String conteudo,
      LocalDateTime dataEnvio
  ) {}
