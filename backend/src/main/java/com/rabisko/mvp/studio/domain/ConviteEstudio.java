package com.rabisko.mvp.studio.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "convites_estudio")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "conviteId")
public class ConviteEstudio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "convite_id", updatable = false, nullable = false)
    private UUID conviteId;

    @Column(name = "estudio_id", nullable = false)
    private UUID estudioId;

    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "convite_status")
    @Builder.Default
    private ConviteStatus status = ConviteStatus.pendente;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;
}
