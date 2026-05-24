package com.rabisko.mvp.domain.artist;

import java.util.UUID;

// =====================================================================
// PROJECTION ArtistSearchProjection — usado pelo Spring Data JPA.
//
// O que e "projection" (projecao)?
//   Uma interface com SO os getters que voce quer trazer do banco.
//   Quando uma @Query no repository devolve `List<ArtistSearchProjection>`,
//   o Spring Data so carrega esses campos — nao a entity inteira.
//   Isso e mais rapido e nao dispara as relacoes LAZY (sem N+1).
//
// IMPORTANTE: os nomes dos getters TEM QUE BATER com os aliases do
// SELECT na @Query do ArtistRepository. Se la voce der `SELECT u.nome AS nome`,
// aqui tem que ter `String getNome()` — bate por reflexao.
// =====================================================================
public interface ArtistSearchProjection {
    UUID getTatuadorId();
    String getNome();
    String getEmail();
    String getEndereco();
}
