package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.artist.Artist;
import com.rabisko.mvp.domain.artist.ArtistSearchProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.List;
import java.util.Optional;


/**
 * Repositorio JPA de Artist (tabela `tatuadores`).
 *
 * `buscar` e uma @Query NATIVA porque precisamos de funcoes Postgres que o
 * JPQL nao oferece (radians/acos/cos/sin = Haversine) e porque mexer com
 * IN-list opcional no JPQL e ruim. Os flags :semEstilo / :semDistancia
 * deixam o filtro "tudo opcional" em uma unica query, decidido no service.
 *
 * Filtra `users.status_ativo = TRUE` pra nao devolver conta desativada.
 *
 * 6371 = raio medio da Terra em km — Haversine clamp em radianos para
 * distancia em km. PostGIS seria mais robusto, mas overkill pro MVP.
 */
public interface ArtistRepository extends JpaRepository<Artist, UUID> {
    Optional<Artist> findByUserId(UUID userId);

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
