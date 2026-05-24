package com.rabisko.mvp.domain.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

// =====================================================================
// ENTIDADE PortfolioImagem — linha da tabela `portfolio_imagens`.
//
// Cada imagem do portfolio de um tatuador e uma linha aqui. A imagem em
// si fica no bucket `portfolio_images` do Supabase Storage; aqui salvamos
// apenas a URL publica e metadados (descricao, ordem de exibicao).
//
// `tatuador_id` e FK pra `tatuadores.tatuador_id` (NAO pra users.user_id).
// Modelamos como UUID solto (sem @ManyToOne) pra evitar carregar a Artist
// inteira em toda query — basta o id pra filtrar.
// =====================================================================

@Entity
@Table(name = "portfolio_imagens")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "imagemId")
public class PortfolioImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "imagem_id", updatable = false, nullable = false)
    private UUID imagemId;

    /** FK pra tatuadores.tatuador_id (dono da imagem). */
    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    /** URL publica da imagem no Supabase Storage. */
    @Column(nullable = false)
    private String url;

    /** Legenda opcional (ex.: "Realismo, 8h"). */
    private String descricao;

    /**
     * Ordem manual de exibicao no carrossel. Nullable — quando null, a UI
     * cai na ordem de insercao (imagem_id ASC, ordenacao deterministica).
     * Permite o tatuador "fixar" trabalhos no inicio sem ter que reuploadar.
     */
    private Integer ordem;
}
