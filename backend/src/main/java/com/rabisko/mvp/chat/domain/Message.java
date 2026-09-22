package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "mensagens")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "mensagemId")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "mensagem_id", updatable = false, nullable = false)
    private UUID mensagemId;

    /** Em qual conversa esta mensagem vive. */
    @Column(name = "chat_id", updatable = false, nullable = false)
    private UUID chatId;

    /** userId de quem ENVIOU. */
    @Column(name = "remetente_id", updatable = false, nullable = false)
    private UUID remetenteId;

    /** userId de quem vai RECEBER. */
    @Column(name = "destinatario_id", updatable = false, nullable = false)
    private UUID destinatarioId;

    /** Texto da mensagem. Sem suporte a anexos no MVP. */
    private String conteudo;

    @CreationTimestamp
    @Column(name = "data_envio", updatable = false, nullable = false)
    private LocalDateTime dataEnvio;
}
