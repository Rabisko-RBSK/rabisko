package com.rabisko.mvp.artist.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;


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

    /** Momento do upload — define a ordem de exibicao (mais recentes primeiro). */
    @CreationTimestamp
    @Column(name = "data_upload", updatable = false, nullable = false)
    private LocalDateTime dataUpload;
}
