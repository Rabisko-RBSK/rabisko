package com.rabisko.mvp.domain.estilo;

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

/**
 * Tabela `estilos` — catalogo controlado de estilos de tatuagem (Realismo,
 * Minimalista, etc.). O banco e fonte da verdade: o vinculo de tatuadores a
 * estilos vive na M:N `tatuador_estilos` (mapeada como @ManyToMany no Artist).
 *
 * Nada de criar estilos via cadastro de usuario — o seed e feito no Supabase.
 */
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

    @Column(nullable = false, unique = true)
    private String nome;

    private String descricao;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
