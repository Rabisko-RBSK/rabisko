package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.chat.Chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

// =====================================================================
// REPOSITORY ChatRepository — acesso a tabela `chats`.
//
// Os 3 metodos abaixo sao "derived queries" — o Spring Data gera o SQL
// a partir do nome:
//
//   findByClienteIdAndTatuadorId  : busca o chat unico entre 2 perfis.
//                                   Usado pra "abrir chat" sem criar
//                                   duplicado (ja que tem UNIQUE no banco).
//
//   findByTatuadorId              : lista todos os chats em que esse
//                                   tatuador participa (tela do tatuador).
//
//   findByClienteId               : analogo, para a tela do cliente.
// =====================================================================
public interface ChatRepository extends JpaRepository<Chat, UUID> {

    Optional<Chat> findByClienteIdAndTatuadorId(UUID clienteId, UUID tatuadorId);

    List<Chat> findByTatuadorId(UUID tatuadorId);

    List<Chat> findByClienteId(UUID clienteId);

    long countByTatuadorIdAndAtivoTrue(UUID tatuadorId);
}
