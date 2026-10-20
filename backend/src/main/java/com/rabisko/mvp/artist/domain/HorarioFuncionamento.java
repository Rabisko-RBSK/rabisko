package com.rabisko.mvp.artist.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;


/**
 * Um dia ABERTO do horario de funcionamento do tatuador. Dia sem linha na
 * tabela = fechado.
 */
@Entity
@Table(name = "tatuador_horarios")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "horarioId")
public class HorarioFuncionamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "horario_id", updatable = false, nullable = false)
    private UUID horarioId;

    /** FK pra tatuadores.tatuador_id. */
    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    /** ISO-8601: 1 = segunda ... 7 = domingo (igual a DayOfWeek#getValue). */
    @Column(name = "dia_semana", nullable = false)
    private short diaSemana;

    @Column(nullable = false)
    private LocalTime abre;

    @Column(nullable = false)
    private LocalTime fecha;
}
