package com.rabisko.mvp.artist.repository;

import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistSearchProjection;
import com.rabisko.mvp.studio.domain.ColaboradorDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
     * Endereco/coordenada do tatuador: se ele e vinculado a um estudio, vale
     * o endereco do ESTUDIO; se e autonomo, vale o endereco proprio. Ambos
     * ficam na tabela `enderecos` (via endereco_id).
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
                   CASE WHEN en.endereco_id IS NULL THEN NULL
                        ELSE en.logradouro
                             || COALESCE(', ' || en.numero, '')
                             || COALESCE(' - ' || en.bairro, '')
                             || ', ' || en.cidade || '/' || en.uf
                   END           AS endereco
            FROM tatuadores t
            JOIN users u ON u.user_id = t.user_id
            LEFT JOIN estudios s ON s.estudio_id = t.estudio_id
            LEFT JOIN enderecos en ON en.endereco_id = COALESCE(s.endereco_id, t.endereco_id)
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
                        en.latitude IS NOT NULL
                        AND en.longitude IS NOT NULL
                        AND 6371 * acos(
                              LEAST(1.0,
                                  cos(radians(:lat)) * cos(radians(en.latitude))
                                * cos(radians(en.longitude) - radians(:lng))
                                + sin(radians(:lat)) * sin(radians(en.latitude))
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

    @Query("""
        SELECT new com.rabisko.mvp.studio.domain.ColaboradorDTO(
            t.tatuadorId, u.nome, t.fotoPerfilUrl, t.instagram)
        FROM Artist t
        JOIN User u ON u.userId = t.userId
        WHERE t.estudioId = :estudioId
        ORDER BY u.nome
        """)
    List<ColaboradorDTO> listarColaboradores(@Param("estudioId") UUID estudioId);

}
