package com.rabisko.mvp.chat.domain;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AbrirChatRequest(
    @NotNull
    UUID outroPerfilId
  ) {}
