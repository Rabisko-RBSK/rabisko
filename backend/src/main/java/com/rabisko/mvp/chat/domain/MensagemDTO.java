package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record MensagemDTO(
      UUID mensagemId,
      UUID chatId,
      UUID remetenteId,
      UUID destinatarioId,
      String conteudo,
      String imagemUrl,
      LocalDateTime dataEnvio
  ) {
    public static MensagemDTO from(Message m) {
      return new MensagemDTO(
          m.getMensagemId(), m.getChatId(),
          m.getRemetenteId(), m.getDestinatarioId(),
          m.getConteudo(), m.getImagemUrl(), m.getDataEnvio()
      );
    }
  }
