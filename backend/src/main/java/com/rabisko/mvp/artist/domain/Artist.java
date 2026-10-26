package com.rabisko.mvp.artist.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
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
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    /**
     * Vinculo opcional com um estudio. Nullable porque o tatuador pode ser
     * AUTONOMO (trabalha por conta propria, sem casa de tatuagem). Quando
     * tem estudio, o app mostra o endereco do estudio; quando nao tem,
     * mostra o endereco proprio (`enderecoId` abaixo).
     */
    @Column(name = "estudio_id")
    private UUID estudioId;

    /**
     * FK pra tabela `enderecos` — endereco de quem trabalha autonomo.
     * Nullable. As coordenadas (latitude/longitude) usadas na busca por
     * distancia ficam la, nao aqui.
     */
    @Column(name = "endereco_id")
    private UUID enderecoId;

    private String bio;

    private String instagram;

    /**
     * URL publica da foto de perfil — salva no bucket `profile_images` do
     * Supabase Storage. Nullable: tatuador sem foto cadastrada cai no avatar
     * padrao da UI.
     */
    @Column(name = "foto_perfil_url")
    private String fotoPerfilUrl;

    /**
     * Atalho booleano que espelha "estudioId != null". Existe pra permitir
     * filtros do tipo "so tatuadores de estudio" sem ter que fazer JOIN.
     */
    @Column(name = "vinculado_estudio", nullable = false)
    private boolean vinculadoEstudio;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
