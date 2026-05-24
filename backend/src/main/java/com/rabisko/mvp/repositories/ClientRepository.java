package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.client.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;


/**
 * Repositorio JPA de Client (tabela `clientes`). Sem queries customizadas
 * por enquanto — JpaRepository cobre o que precisamos.
 */
public interface ClientRepository extends JpaRepository<Client, UUID> {
    Optional<Client> findByUserId(UUID userId);
}
