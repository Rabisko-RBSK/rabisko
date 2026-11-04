package com.rabisko.mvp.chat.repository;

import com.rabisko.mvp.chat.domain.Message;
import com.rabisko.mvp.chat.domain.NaoLidasDoChat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByChatIdOrderByDataEnvioDesc(UUID chatId, Pageable pageable);

    Optional<Message> findTopByChatIdOrderByDataEnvioDesc(UUID chatId);

    /**
     * Mensagens não lidas pelo tatuador, por chat, dos chats desses tatuadores:
     * as recebidas por ele depois de chats.tatuador_leu_em (todas, se nunca leu).
     */
    @Query("""
        SELECT new com.rabisko.mvp.chat.domain.NaoLidasDoChat(
            m.chatId, COUNT(m), MIN(m.dataEnvio), MAX(m.dataEnvio))
        FROM Message m, Chat c, Artist a
        WHERE c.chatId = m.chatId
          AND a.tatuadorId = c.tatuadorId
          AND c.tatuadorId IN :tatuadorIds
          AND m.destinatarioId = a.authId
          AND (c.tatuadorLeuEm IS NULL OR m.dataEnvio > c.tatuadorLeuEm)
        GROUP BY m.chatId
        """)
    List<NaoLidasDoChat> naoLidasPeloTatuador(@Param("tatuadorIds") Collection<UUID> tatuadorIds);
}
