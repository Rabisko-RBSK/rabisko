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
    @Column(name = "auth_id", unique = true)
    private UUID authId;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    private String telefone;

    /** FK pra tabela `enderecos` — endereco fisico do estudio. Nullable. */
    @Column(name = "endereco_id")
    private UUID enderecoId;

    /**
     * URL publica da foto de perfil (bucket `profile_images` do Supabase
     * Storage). Nullable: sem foto, a UI mostra o avatar padrao.
     */
    @Column(name = "foto_perfil_url")
    private String fotoPerfilUrl;

    /**
     * Quantidade de posicoes (macas/bancadas) de atendimento. Cada sessao de
     * um tatuador do estudio ocupa uma posicao (`reservas.posicao`), e duas
     * sessoes nao podem se sobrepor na mesma posicao.
     */
    @Column(name = "posicoes", nullable = false)
    @Builder.Default
    private int posicoes = 1;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "termos_aceitos")
    private boolean termosAceitos;

    @Column(name = "status_ativo", nullable = false)
    @Builder.Default
    private boolean statusAtivo = true;

    @Column(name = "data_modificacao", updatable = false, insertable = false)
    private LocalDateTime dataModificacao;
}
