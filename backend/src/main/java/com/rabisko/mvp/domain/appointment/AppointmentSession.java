package com.rabisko.mvp.domain.appointment;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "sessionId")
public class AppointmentSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "reserva_id", updatable = false, nullable = false)
    private UUID sessionId;

    /** FK para `servicos.servico_id` — o agendamento pai. */
    @Column(name = "orcamento_id", nullable = false)
    private UUID appointmentId;

    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    /** Data + horário combinados, gravados em UTC. */
    @Column(name = "data_sessao", nullable = false)
    private LocalDateTime dataSessao;

    @Column(name = "duracao_min", nullable = false)
    private int duracaoMinutos;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "reserva_status")
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.confirmada;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
