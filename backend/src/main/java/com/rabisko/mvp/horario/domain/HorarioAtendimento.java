package com.rabisko.mvp.horario.domain;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "horarios_atendimento")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "horarioId")
public class HorarioAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "horario_id", updatable = false, nullable = false)
    private UUID horarioId;

    @Column(name = "estudio_id", nullable = false)
    private UUID estudioId;

    @Column(name = "dia_semana")
    private short diaSemana;

    @Column(name = "abre")
    private LocalTime abre;

    @Column(name = "fecha")
    private LocalTime fecha;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
