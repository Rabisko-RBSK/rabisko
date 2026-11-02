package com.rabisko.mvp.chat.repository;

import com.rabisko.mvp.chat.domain.Chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatRepository extends JpaRepository<Chat, UUID> {

    Optional<Chat> findByClienteIdAndTatuadorId(UUID clienteId, UUID tatuadorId);

    List<Chat> findByTatuadorId(UUID tatuadorId);

    List<Chat> findByClienteId(UUID clienteId);

    long countByTatuadorIdAndAtivoTrue(UUID tatuadorId);

    @Transactional
    @Modifying
    @Query("UPDATE Chat c SET c.clienteLeuEm = :quando WHERE c.chatId = :chatId")
    void marcarLidoPeloCliente(@Param("chatId") UUID chatId, @Param("quando") LocalDateTime quando);

    @Transactional
    @Modifying
    @Query("UPDATE Chat c SET c.tatuadorLeuEm = :quando WHERE c.chatId = :chatId")
    void marcarLidoPeloTatuador(@Param("chatId") UUID chatId, @Param("quando") LocalDateTime quando);
}
