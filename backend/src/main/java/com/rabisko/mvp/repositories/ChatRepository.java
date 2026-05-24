package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.chat.Chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRepository extends JpaRepository<Chat, UUID>{
    Optional<Chat> findByClienteIdAndTatuadorId(UUID clienteId, UUID tatuadorId);

    List<Chat> findByTatuadorId(UUID tatuadorId);

    List<Chat> findByClienteId(UUID clienteId);
}
