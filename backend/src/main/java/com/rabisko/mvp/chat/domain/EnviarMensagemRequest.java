package com.rabisko.mvp.chat.domain;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnviarMensagemRequest(
    @NotNull
    UUID chatId,

    @NotBlank
    @Size(max = 2000)
    String conteudo
  ) {}
