package com.rabisko.mvp.client.repository;

import com.rabisko.mvp.client.domain.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {

    /**
     * Busca o perfil cliente pelo User. Optional permite tratar "nao
     * existe" sem null check explicito (.orElseThrow / .ifPresent / etc.).
     */
    Optional<Client> findByUserId(UUID userId);
}
