package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.CnpjStatus;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.domain.StudioSearchProjection;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudioRepository extends JpaRepository<Studio, UUID> {
    boolean existsByCnpj(String cnpj);
    
    Optional<Studio> findByAuthId(UUID userId);

    /**
     * Le o estudio com SELECT ... FOR UPDATE. Usado ao criar agendamentos para
     * serializar as reservas do mesmo estudio: sem isso, dois tatuadores
     * poderiam validar e gravar a mesma posicao/horario ao mesmo tempo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Studio s where s.estudioId = :estudioId")
    Optional<Studio> lockById(@Param("estudioId") UUID estudioId);

    /**
     * Estúdios com CNPJ para conferir de novo na Receita: pendentes e irregulares
     * (todo dia) e verificados há mais de `limite`. Os nunca consultados vêm primeiro.
     */
    @Query("""
        select s from Studio s
        where s.cnpj is not null
        and (s.cnpjStatus in :reconferir
            or s.cnpjVerificadoEm is null
            or s.cnpjVerificadoEm < :limite)
        order by s.cnpjVerificadoEm asc nulls first
    """)
        List<Studio> paraReverificarCnpj(@Param("reconferir") Collection<CnpjStatus> reconferir,
                                    @Param("limite") LocalDateTime limite);

    /**
     * Busca de estúdios para o cliente, com os mesmos filtros de
     * ArtistRepository.buscar: estilo (algum tatuador com contrato ativo no
     * estúdio tem o estilo no portfólio) e distância (Haversine sobre o
     * endereço do estúdio). Nota e estilos agregam a equipe ativa; estúdio sem
     * nenhum tatuador ativo fica fora — não teria quem atender.
     */
    @Query(value = """
            WITH equipe AS (
                SELECT c.estudio_id, c.tatuador_id
                FROM contratos_colaborador c
                JOIN tatuadores t ON t.tatuador_id = c.tatuador_id AND t.status_ativo = TRUE
                WHERE c.status = 'ativo'
            )
            SELECT s.estudio_id     AS estudioId,
                   s.nome           AS nome,
                   CASE WHEN en.endereco_id IS NULL THEN NULL
                        ELSE en.logradouro
                             || COALESCE(', ' || en.numero, '')
                             || COALESCE(' - ' || en.bairro, '')
                             || ', ' || en.cidade || '/' || en.uf
                   END              AS endereco,
                   s.foto_perfil_url AS fotoPerfilUrl,
                   (SELECT ROUND(AVG(sv.avaliacao_nota), 1)
                      FROM servicos sv JOIN equipe eq ON eq.tatuador_id = sv.tatuador_id
                     WHERE eq.estudio_id = s.estudio_id
                       AND sv.avaliacao_nota IS NOT NULL) AS notaMedia,
                   (SELECT COUNT(*)
                      FROM servicos sv JOIN equipe eq ON eq.tatuador_id = sv.tatuador_id
                     WHERE eq.estudio_id = s.estudio_id
                       AND sv.avaliacao_nota IS NOT NULL) AS totalAvaliacoes,
                   (SELECT COUNT(*) FROM equipe eq WHERE eq.estudio_id = s.estudio_id) AS totalTatuadores,
                   ARRAY(SELECT DISTINCT e.nome
                           FROM equipe eq
                           JOIN portfolio p ON p.tatuador_id = eq.tatuador_id
                           JOIN estilos e ON e.estilo_id = p.estilo_id
                          WHERE eq.estudio_id = s.estudio_id
                          ORDER BY e.nome) AS estilos
            FROM estudios s
            LEFT JOIN enderecos en ON en.endereco_id = s.endereco_id
            WHERE s.status_ativo = TRUE
              AND EXISTS (SELECT 1 FROM equipe eq WHERE eq.estudio_id = s.estudio_id)
              AND (
                    :semEstilo = TRUE
                    OR EXISTS (
                        SELECT 1
                        FROM equipe eq
                        JOIN portfolio p ON p.tatuador_id = eq.tatuador_id
                        JOIN estilos e ON e.estilo_id = p.estilo_id
                        WHERE eq.estudio_id = s.estudio_id
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
            ORDER BY s.nome
            """, nativeQuery = true)
    List<StudioSearchProjection> buscar(
            @Param("semEstilo") boolean semEstilo,
            @Param("estilos") Collection<String> estilos,
            @Param("semDistancia") boolean semDistancia,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("raioKm") Double raioKm
    );

}
