package com.rabisko.mvp.estilo.repository;

import com.rabisko.mvp.estilo.domain.Estilo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EstiloRepository extends JpaRepository<Estilo, UUID> {

    Optional<Estilo> findByNomeIgnoreCase(String nome);

    List<Estilo> findByNomeInIgnoreCase(Collection<String> nomes);
}
