package com.rabisko.mvp.client.domain;

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

    @Column(name = "auth_id", nullable = false, unique = true)
    private UUID authId;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "telefone")
    private String telefone;


    @Column(name = "data_nasc")
    private LocalDate dataNasc;

    @Column(name = "cpf", unique = true)
    private String cpf;

    @Column(name = "termos_aceitos")
    private boolean termosAceitos;

    @Column(name = "status_ativo", nullable = false)
    @Builder.Default
    private boolean statusAtivo = true;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_modificacao", updatable = false, insertable = false)
    private LocalDateTime dataModificacao;
}
