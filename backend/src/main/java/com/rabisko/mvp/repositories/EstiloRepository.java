package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.estilo.Estilo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA do catalogo `estilos`. Derived queries case-insensitive —
 * o front manda os nomes como "Realismo" e o banco guarda assim, mas usamos
 * IgnoreCase pra tolerar payload em qualquer caixa.
 */
public interface EstiloRepository extends JpaRepository<Estilo, UUID> {

    Optional<Estilo> findByNomeIgnoreCase(String nome);

    List<Estilo> findByNomeInIgnoreCase(Collection<String> nomes);
}
