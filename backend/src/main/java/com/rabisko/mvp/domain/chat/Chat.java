package com.rabisko.mvp.domain.chat;

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

// =====================================================================
// ENTIDADE Chat — linha da tabela `chats`.
//
// Representa uma CONVERSA entre 1 cliente e 1 tatuador. Cada linha tem:
//   - chat_id          : id unico da conversa
//   - cliente_id       : FK pro perfil cliente
//   - tatuador_id      : FK pro perfil tatuador
//   - ativo            : flag pra "fechar" o chat sem apagar
//   - ultimaMensagemEm : timestamp da ultima msg (alimentado por TRIGGER
//                        no Postgres — ver `update_chat_last_message`)
//
// A restricao UNIQUE em (cliente_id, tatuador_id) garante que NAO
// existam dois chats para o mesmo par cliente-tatuador. Se o usuario
// tentar abrir um "novo" chat, o ChatService devolve o que ja existe.
// =====================================================================

@Entity
@Table(
    name = "chats",
    // UniqueConstraint composta: nao pode existir 2 chats com mesmo par.
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
    private UUID clienteId;          // FK pra tabela `clientes`

    @Column(name = "tatuador_id", nullable = false)
    private UUID tatuadorId;         // FK pra tabela `tatuadores`

    private boolean ativo;           // false = chat encerrado (mas historico fica)

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
}
