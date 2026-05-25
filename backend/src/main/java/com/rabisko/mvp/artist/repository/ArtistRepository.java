package com.rabisko.mvp.artist.repository;

import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistSearchProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// =====================================================================
// REPOSITORY ArtistRepository — acesso a tabela `tatuadores`.
//
// Alem das funcoes herdadas de JpaRepository, traz:
//   - findByUserId  : derived query simples
//   - buscar        : @Query NATIVA com SQL puro (Postgres)
//
// Por que SQL nativo em `buscar`?
//   Porque a busca calcula DISTANCIA GEOGRAFICA (formula de Haversine)
//   usando funcoes Postgres: radians(), acos(), cos(), sin(). O JPQL
//   (linguagem padrao do JPA) nao tem essas funcoes. Como o SQL ja e
//   especifico do Postgres, escrevemos direto.
//
// Os parametros `:semEstilo` e `:semDistancia` deixam os filtros
// OPCIONAIS na mesma query — quando o front nao manda estilo, o service
// passa `semEstilo=true` e essa parte do WHERE e "ignorada".
// =====================================================================
public interface ArtistRepository extends JpaRepository<Artist, UUID> {

    /** Busca o perfil tatuador a partir do User. */
    Optional<Artist> findByUserId(UUID userId);

    /**
     * Busca de tatuadores com filtros opcionais (estilos + distancia).
     *
     * Como cada filtro funciona:
     *  - Se :semEstilo = true   -> ignora o filtro de estilos
     *    Senao -> tatuador tem que ter pelo menos 1 estilo da lista :estilos
     *  - Se :semDistancia = true -> ignora o filtro geografico
     *    Senao -> calcula distancia entre (lat, lng) e a coordenada do
     *             tatuador via Haversine; aceita se <= raioKm
     *
     * 6371 = raio medio da Terra em km. LEAST(1.0, ...) protege contra
     * imprecisao numerica que poderia fazer acos receber > 1.0 (NaN).
     *
     * O retorno e uma PROJECAO (ArtistSearchProjection) em vez da entity:
     * mais leve, sem disparar relacoes LAZY (estilos M:N).
     */
    @Query(value = """
            SELECT t.tatuador_id AS tatuadorId,
                   u.nome        AS nome,
                   u.email       AS email,
                   t.endereco    AS endereco
            FROM tatuadores t
            JOIN users u ON u.user_id = t.user_id
            WHERE u.status_ativo = TRUE
              AND (
                    :semEstilo = TRUE
                    OR EXISTS (
                        SELECT 1
                        FROM tatuador_estilos te
                        JOIN estilos e ON e.estilo_id = te.estilo_id
                        WHERE te.tatuador_id = t.tatuador_id
                          AND LOWER(e.nome) IN (:estilos)
                    )
                  )
              AND (
                    :semDistancia = TRUE
                    OR (
                        t.latitude IS NOT NULL
                        AND t.longitude IS NOT NULL
                        AND 6371 * acos(
                              LEAST(1.0,
                                  cos(radians(:lat)) * cos(radians(t.latitude))
                                * cos(radians(t.longitude) - radians(:lng))
                                + sin(radians(:lat)) * sin(radians(t.latitude))
                              )
                        ) <= :raioKm
                    )
                  )
            ORDER BY u.nome
            """, nativeQuery = true)
    List<ArtistSearchProjection> buscar(
            @Param("semEstilo") boolean semEstilo,
            @Param("estilos") Collection<String> estilos,
            @Param("semDistancia") boolean semDistancia,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("raioKm") Double raioKm
    );
}
