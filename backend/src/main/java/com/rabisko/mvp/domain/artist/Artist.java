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

// =====================================================================
// ENTIDADE Artist — linha da tabela `tatuadores`.
//
// Igual ao Client: e o "perfil tatuador" que complementa um User.
// Aqui guardamos SO o que e proprio do tatuador (bio, instagram, estilos,
// vinculo com estudio). Nome/email/cpf vivem no User correspondente.
//
// Por que NAO duplicar nome/email aqui?
//   Duplicacao = sincronizacao. Se o usuario editasse o nome, teriamos
//   que atualizar EM DOIS lugares. Esquecer um = bug classico. Melhor
//   pegar via JOIN ou consultar UserRepository quando precisar.
// =====================================================================

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
     * mostra o `endereco` abaixo.
     */
    @Column(name = "estudio_id")
    private UUID estudioId;

    /**
     * Endereco de quem trabalha autonomo. Texto livre (string) por enquanto.
     * No futuro, vira FK pra uma tabela `enderecos` polimorfica.
     */
    private String endereco;

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
     * Quem atualiza esse flag e o ArtistService quando muda o vinculo.
     */
    @Column(name = "vinculado_estudio", nullable = false)
    private boolean vinculadoEstudio;

    /**
     * Coordenadas opcionais (latitude/longitude). Usadas pela busca
     * "tatuadores perto de mim" — o ArtistRepository.buscar() usa formula
     * de Haversine em SQL nativo pra calcular distancia. Null = o tatuador
     * nao aparece nesse filtro.
     */
    private BigDecimal latitude;

    private BigDecimal longitude;

    /**
     * Relacao MUITOS-PRA-MUITOS (Many-to-Many) com a tabela `estilos`.
     *
     * O que isso significa?
     *   Um tatuador pode fazer varios estilos (Realismo, Blackwork, ...)
     *   e cada estilo pode ser feito por varios tatuadores. Quando isso
     *   acontece no banco, a gente usa uma TABELA DE JUNCAO no meio:
     *   `tatuador_estilos` (tatuador_id, estilo_id).
     *
     * @JoinTable diz ao Hibernate qual e a tabela do meio e quais sao
     * as suas colunas. Quando voce chama artist.getEstilos(), o Hibernate
     * faz o JOIN automatico pra trazer os estilos relacionados.
     *
     * fetch = LAZY: NAO carrega os estilos imediatamente quando carrega
     * o tatuador. So vai no banco buscar a lista quando alguem chamar
     * getEstilos() (economia de query quando voce so precisa do nome).
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tatuador_estilos",                              // nome da tabela de juncao
            joinColumns = @JoinColumn(name = "tatuador_id"),        // FK pra esta entidade
            inverseJoinColumns = @JoinColumn(name = "estilo_id")    // FK pra Estilo
    )
    @Builder.Default        // sem isso, o Builder colocaria null em vez de um Set vazio
    private Set<Estilo> estilos = new HashSet<>();

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
