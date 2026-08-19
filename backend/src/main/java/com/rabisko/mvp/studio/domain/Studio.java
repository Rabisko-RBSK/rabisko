package com.rabisko.mvp.studio.domain;

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
@Table(name = "estudios")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "estudioId")
public class Studio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "estudio_id", updatable = false, nullable = false)
    private UUID estudioId;

    /**
     * FK pro User dono. UNIQUE = no MVP, cada usuario "estudio" pode
     * gerenciar APENAS 1 estudio. Suporte a multi-estudio fica pra dps.
     */
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    private String nome;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(unique = true)
    private String cnpj;

    private String telefone;

    /** Endereco fisico. String livre por enquanto (futuro: tabela `enderecos`). */
    private String endereco;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
