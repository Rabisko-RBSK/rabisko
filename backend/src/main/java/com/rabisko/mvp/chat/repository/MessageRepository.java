package com.rabisko.mvp.chat.repository;

import com.rabisko.mvp.chat.domain.Message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByChatIdOrderByDataEnvioDesc(UUID chatId, Pageable pageable);

    Optional<Message> findTopByChatIdOrderByDataEnvioDesc(UUID chatId);
}
