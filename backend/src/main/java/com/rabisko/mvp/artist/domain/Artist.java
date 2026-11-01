package com.rabisko.mvp.artist.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "tatuadores")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "tatuadorId")
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tatuador_id", updatable = false, nullable = false)
    private UUID tatuadorId;

    /** FK pro User dono. UNIQUE = cada usuario "tatuador" tem 1 perfil. */
    @Column(name = "auth_id", nullable = false, unique = true)
    private UUID authId;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "cpf", unique = true)
    private String cpf;

    @Column(name = "data_nasc")
    private LocalDate dataNasc;

    @Column(name = "telefone")
    private String telefone;

    private String bio;

    private String instagram;

    /**
     * URL publica da foto de perfil — salva no bucket `profile_images` do
     * Supabase Storage. Nullable: tatuador sem foto cadastrada cai no avatar
     * padrao da UI.
     */
    @Column(name = "foto_perfil_url")
    private String fotoPerfilUrl;

    @Column(name = "termos_aceitos")
    private boolean termosAceitos;

    @Column(name = "status_ativo", nullable = false)
    @Builder.Default
    private boolean statusAtivo = true;

    @Column(name = "data_modificacao", updatable = false, insertable = false)
    private LocalDateTime dataModificacao;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
