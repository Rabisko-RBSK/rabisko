package com.rabisko.mvp.domain.message;

import java.time.LocalDateTime;
import java.util.UUID;

public record MensagemDTO(
      UUID mensagemId,
      UUID chatId,
      UUID remetenteId,
      UUID destinatarioId,
      String conteudo,
      LocalDateTime dataEnvio
  ) {}
