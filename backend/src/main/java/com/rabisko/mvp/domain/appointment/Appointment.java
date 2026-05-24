package com.rabisko.mvp.domain.appointment;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "servicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "appointmentId")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "servico_id", updatable = false, nullable = false)
    private UUID appointmentId;

    @Column(name = "chat_id")
    private UUID chatId;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "reserva_status")
    private AppointmentStatus status;

    @Column(name = "valor_total", nullable = false)
    private BigDecimal valorTotal;

    /** Colunas obrigatórias da tabela `servicos` — não usadas no agendamento via chat. */
    @Column(name = "valor_sinal", nullable = false)
    @Builder.Default
    private BigDecimal valorSinal = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean finalizado = false;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
