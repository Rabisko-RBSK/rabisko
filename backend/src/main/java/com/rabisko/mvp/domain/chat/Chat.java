package com.rabisko.mvp.domain.chat;

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
@Table(name = "chats")
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

    @Column(name = "cliente_id", nullable = false, unique = true)
    private UUID clienteId;

    @Column(name = "tatuador_id", nullable = false, unique = true)
    private UUID tatuadorId;

    private boolean ativo;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;
}
