package com.rabisko.mvp.studio.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "contratos_colaborador")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "contratoId")
public class ContratoColaborador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "contrato_id", updatable = false, nullable = false)
    private UUID contratoId;

    @Column(name = "estudio_id", nullable = false, updatable = false)
    private UUID estudioId;

    @Column(name = "tatuador_id", nullable = false, updatable = false)
    private UUID tatuadorId;

    @Column(name = "convite_id", updatable = false)
    private UUID conviteId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "modelo", nullable = false, updatable = false, columnDefinition = "contrato_modelo")
    private ContratoModelo modelo;

    @Column(name = "percentual_estudio", precision = 5, scale = 2, updatable = false)
    private BigDecimal percentualEstudio;

    @Column(name = "valor_fixo", precision = 10, scale = 2, updatable = false)
    private BigDecimal valorFixo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "periodicidade", updatable = false, columnDefinition = "contrato_periodicidade")
    private ContratoPeriodicidade periodicidade;

    @Column(name = "observacoes", length = 500, updatable = false)
    private String observacoes;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "contrato_status")
    @Builder.Default
    private ContratoStatus status = ContratoStatus.proposto;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;

    @Column(name = "data_encerramento")
    private LocalDateTime dataEncerramento;
}