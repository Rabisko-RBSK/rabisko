package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mensagens de um chat que o tatuador ainda não leu: quantas, a mais antiga
 * (desde quando o cliente espera resposta) e a mais recente.
 */
public record NaoLidasDoChat(
    UUID chatId,
    long naoLidas,
    LocalDateTime primeiraNaoLida,
    LocalDateTime ultimaNaoLida
) {}
