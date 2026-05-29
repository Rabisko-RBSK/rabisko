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

// =====================================================================
// ENTIDADE Studio — linha da tabela `estudios`.
//
// Perfil de "casa de tatuagem". Como Artist e Client, complementa um
// User (o dono do estudio).
//
// Diferenca importante em relacao a Artist:
//   Aqui guardamos nome/email/telefone NA PROPRIA linha do estudio,
//   mesmo ja tendo esses dados no User. Por que? Porque estudio e uma
//   ENTIDADE COMERCIAL: pode ter NOME FANTASIA diferente do nome do
//   dono, EMAIL COMERCIAL diferente do pessoal, etc. No cadastro inicial
//   sao copiados do User, mas a tela "editar estudio" (futura) deixa
//   editar separado.
// =====================================================================

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
    private String nome;       // nome do estudio (pode ser nome fantasia)

    @Column(name = "email", nullable = false)
    private String email;      // email comercial

    @Column(unique = true)
    // cnpj UNIQUE: o banco rejeita 2 estudios com mesmo CNPJ. Nullable pq
    // dono pode cadastrar o estudio antes de ter o CNPJ formalizado.
    private String cnpj;

    private String telefone;

    /** Endereco fisico. String livre por enquanto (futuro: tabela `enderecos`). */
    private String endereco;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
