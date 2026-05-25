package com.rabisko.mvp.client.domain;

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
// ENTIDADE Client — linha da tabela `clientes`.
//
// Modelo de dados que usamos no projeto:
//   Toda CONTA vive em `users` (login, senha, nome, cpf...). Quando o
//   usuario e do papel "cliente", criamos TAMBEM uma linha em `clientes`
//   que aponta pra ele via user_id. Isso e o "perfil cliente".
//
// Por que separar em duas tabelas em vez de jogar tudo num User so?
//   Cada papel tem campos proprios. Cliente tem dados de pagamento;
//   tatuador tem bio/instagram/estilos; estudio tem cnpj/endereco
//   comercial. Misturar tudo numa tabela so daria colunas vazias na
//   maioria das linhas. Separando, cada tabela carrega so o que faz
//   sentido pra ela.
// =====================================================================

@Entity
@Table(name = "clientes")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "clientId")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)   // Java gera o UUID na hora de salvar
    @Column(name = "cliente_id", updatable = false, nullable = false)
    private UUID clientId;

    /**
     * Chave estrangeira (FK) que liga este perfil ao User dono.
     * UNIQUE: cada usuario do tipo "cliente" tem APENAS 1 perfil
     * cliente (relacao 1-pra-1).
     */
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    /**
     * Token retornado pelo gateway de pagamento (Mercado Pago / Stripe / etc.)
     * quando o cliente cadastra um cartao. Fica null no cadastro inicial
     * e e preenchido na tela de configuracoes quando o usuario adicionar
     * forma de pagamento.
     */
    @Column(name = "dados_pagamento_token")
    private String dadosPagamentoToken;

    @CreationTimestamp        // Hibernate preenche automatico no INSERT
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
