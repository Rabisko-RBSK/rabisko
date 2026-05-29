package com.rabisko.mvp.chat.repository;

import com.rabisko.mvp.chat.domain.Message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// =====================================================================
// REPOSITORY MessageRepository — acesso a tabela `mensagens`.
//
// findByChatIdOrderByDataEnvioDesc:
//   Lista paginada das mensagens de um chat, das MAIS RECENTES pras
//   mais antigas. Usado pra carregar o historico ao abrir a tela do
//   chat (com infinite scroll).
//
//   O parametro Pageable permite que o caller passe `PageRequest.of(0, 20)`
//   pra trazer pagina 0 com 20 itens. Retorna `Page<Message>` (a entity
//   Page traz total, numero da pagina, etc.).
//
// findTopByChatIdOrderByDataEnvioDesc:
//   Pega so a ULTIMA mensagem do chat. Usado na lista de conversas pra
//   mostrar o preview "ultima mensagem trocada".
//   `Top` no nome = LIMIT 1.
// =====================================================================
public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByChatIdOrderByDataEnvioDesc(UUID chatId, Pageable pageable);

    Optional<Message> findTopByChatIdOrderByDataEnvioDesc(UUID chatId);
}
