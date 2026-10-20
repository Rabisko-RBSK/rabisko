package com.rabisko.mvp.horario.domain;

import java.sql.Time;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.rabisko.mvp.estilo.domain.Estilo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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

    @Column(name = "tatuador_id")
    private UUID tatuadorId;

    @Column(name = "estudio_id")
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
