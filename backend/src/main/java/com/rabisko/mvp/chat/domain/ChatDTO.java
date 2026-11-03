package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatDTO(
    UUID chatId,
    UUID outroUsuarioId,
    String outroUsuarioNome,
    String ultimaMensagem,
    LocalDateTime dataUltimaMensagem,
    boolean ativo,
    /** A última mensagem é para o usuário logado e chegou depois da última leitura dele. */
    boolean naoLida
) {}
