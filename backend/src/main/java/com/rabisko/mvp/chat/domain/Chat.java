package com.rabisko.mvp.chat.domain;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(
    name = "chats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"cliente_id","tatuador_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "chatId")
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "chat_id", updatable = false, nullable = false)
    private UUID chatId;

    @Column(name = "cliente_id", nullable = false)
    private UUID clienteId;

    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;

    private boolean ativo;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    /**
     * Atualizado AUTOMATICAMENTE pela trigger `update_chat_last_message`
     * no Postgres toda vez que uma mensagem nova entra em `mensagens`.
     * Usado pra ordenar a lista de conversas do usuario por atividade.
     *
     * OffsetDateTime (e nao LocalDateTime) porque a coluna no banco e
     * TIMESTAMPTZ — guarda timezone junto.
     */
    @Column(name = "ultima_mensagem_em")
    private OffsetDateTime ultimaMensagemEm;

    /**
     * Até quando cada participante leu a conversa (mensagens enviadas depois
     * disso estão não lidas para ele). Só mudam pelas queries de
     * ChatRepository — fora do save() para um Chat carregado antes não
     * sobrescrever a leitura (nem o ultima_mensagem_em da trigger).
     */
    @Column(name = "cliente_leu_em", insertable = false, updatable = false)
    private LocalDateTime clienteLeuEm;

    @Column(name = "tatuador_leu_em", insertable = false, updatable = false)
    private LocalDateTime tatuadorLeuEm;
}
