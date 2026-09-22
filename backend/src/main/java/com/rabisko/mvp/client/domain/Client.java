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
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
