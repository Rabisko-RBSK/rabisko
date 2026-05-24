package com.rabisko.mvp.domain.chat;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AbrirChatRequest(
    @NotNull 
    UUID outroPerfilId
  ) {}
