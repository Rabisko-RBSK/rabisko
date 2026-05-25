package com.rabisko.mvp.estilo.repository;

import com.rabisko.mvp.estilo.domain.Estilo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// =====================================================================
// REPOSITORY EstiloRepository — acesso a tabela `estilos`.
//
// Derived queries com `IgnoreCase`:
//   O sufixo `IgnoreCase` no nome do metodo faz o Spring Data gerar
//   `WHERE LOWER(nome) = LOWER(?)`. Isso tolera o front mandar
//   "REALISMO", "realismo" ou "Realismo" — todos batem.
//
//   - findByNomeIgnoreCase(nome)       : 1 estilo pelo nome
//   - findByNomeInIgnoreCase(nomes)    : varios estilos pela lista de nomes
//                                         (usado no cadastro de tatuador
//                                         pra resolver os estilos escolhidos)
// =====================================================================
public interface EstiloRepository extends JpaRepository<Estilo, UUID> {

    Optional<Estilo> findByNomeIgnoreCase(String nome);

    List<Estilo> findByNomeInIgnoreCase(Collection<String> nomes);
}
