package com.rabisko.mvp.domain.chat;

import java.time.LocalDateTime;
import java.util.UUID;


public record ChatDTO(
    UUID chatId,
    UUID outroUsuarioId,
    String outroUsuarioNome,
    String ultimaMensagem,
    LocalDateTime dataUltimaMensagem,
    boolean ativo
) {}
