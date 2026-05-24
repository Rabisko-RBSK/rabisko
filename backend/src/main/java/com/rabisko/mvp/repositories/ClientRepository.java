package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.client.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// =====================================================================
// REPOSITORY ClientRepository — acesso a tabela `clientes`.
//
// Por enquanto so precisa do CRUD basico que vem de JpaRepository, mais
// uma derived query pra achar o perfil cliente a partir do User dono.
// =====================================================================
public interface ClientRepository extends JpaRepository<Client, UUID> {

    /**
     * Busca o perfil cliente pelo User. Optional permite tratar "nao
     * existe" sem null check explicito (.orElseThrow / .ifPresent / etc.).
     */
    Optional<Client> findByUserId(UUID userId);
}
