package com.rabisko.mvp.domain.artist;

import com.rabisko.mvp.domain.estilo.Estilo;
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
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Linha em `tatuadores` — materializa o papel "artista" de um User. Aggregate
 * enxuto: guarda APENAS o que e proprio do tatuador.
 *
 * Dados pessoais (nome/email/cpf/telefone/senha) vivem no `users`. Pra
 * obte-los, faca JOIN via user_id ou consulta UserRepository.findById.
 *
 * Por que nao duplicar:
 *  - Schema do Supabase nao tem essas colunas em `tatuadores`.
 *  - Duplicacao geraria sincronizacao (toda vez que o user editar nome,
 *    teria que atualizar nas duas tabelas) — fonte classica de bug.
 *
 * O que fica aqui (proprio do papel):
 *  - bio, instagram, endereco
 *  - latitude/longitude (busca por distancia via Haversine)
 *  - vinculo com estudio (estudio_id + flag)
 *  - vinculo com estilos (M:N `tatuador_estilos`)
 */
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

    /** FK pro User dono. UNIQUE: cada User com role=tatuador tem 1 perfil. */
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    /**
     * Nullable: tatuador pode ser autonomo (sem estudio). Quando ha vinculo,
     * o app usa o endereco do estudio; caso contrario, usa o `endereco` abaixo.
     */
    @Column(name = "estudio_id")
    private UUID estudioId;

    /**
     * Endereco do tatuador autonomo (texto livre no MVP). Migrar pra
     * @OneToOne com `enderecos` quando essa tabela polimorfica virar entity.
     */
    private String endereco;

    private String bio;

    private String instagram;

    /** Espelha a presenca de estudio_id; util pra filtros sem JOIN. */
    @Column(name = "vinculado_estudio", nullable = false)
    private boolean vinculadoEstudio;

    /**
     * Coordenadas opcionais. Usadas pela busca por distancia (Haversine em
     * SQL nativo no ArtistRepository.buscar). Null = tatuador nao apareceu
     * no filtro "perto de mim".
     */
    private BigDecimal latitude;

    private BigDecimal longitude;

    /**
     * M:N com o catalogo de estilos via `tatuador_estilos`. A coluna
     * `data_criacao` da tabela de juncao e preenchida pelo DEFAULT do banco
     * — Hibernate so escreve (tatuador_id, estilo_id) e ignora o resto.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tatuador_estilos",
            joinColumns = @JoinColumn(name = "tatuador_id"),
            inverseJoinColumns = @JoinColumn(name = "estilo_id")
    )
    @Builder.Default
    private Set<Estilo> estilos = new HashSet<>();

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
