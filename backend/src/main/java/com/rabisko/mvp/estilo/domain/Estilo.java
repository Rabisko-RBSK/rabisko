package com.rabisko.mvp.estilo.domain;

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
@Table(name = "estilos")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "estiloId")
public class Estilo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "estilo_id", updatable = false, nullable = false)
    private UUID estiloId;

    /** Nome do estilo. UNIQUE: nao pode ter 2 estilos com mesmo nome. */
    @Column(nullable = false, unique = true)
    private String nome;

    /** Descricao opcional (ex.: "tracos finos e geometria"). */
    private String descricao;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
