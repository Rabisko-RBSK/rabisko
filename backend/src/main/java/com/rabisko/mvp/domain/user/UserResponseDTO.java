package com.rabisko.mvp.domain.user;

import java.time.LocalDate;
import java.util.UUID;

// =====================================================================
// DTO UserResponseDTO — resposta do GET /user/me e composicao em outras.
//
// Por que existir se ja temos a entity User?
//   Pra FILTRAR o que sai pra fora. A entity User tem campos sensiveis:
//   - senha (hash, mas ainda perigoso expor)
//   - status (flag interna)
//   - dataCriacao/dataModificacao (metadados internos)
//   - termosAceitos (auditoria, nao interessa ao cliente)
//
//   Se devolvermos `User` diretamente no JSON, o Jackson serializa
//   TODOS esses campos e eles aparecem na resposta. Usando o DTO,
//   escolhemos EXATAMENTE o que vai pro front.
//
// IMPORTANTE: ao adicionar um campo PUBLICO novo em User.java, lembrar
// de adicionar AQUI tambem — senao o front nao recebe.
// =====================================================================
public record UserResponseDTO(
    UUID userId,
    String nome,
    String email,
    String telefone,
    LocalDate dataNasc,
    UserRole role
) {
    /**
     * Helper de conversao: User -> UserResponseDTO. Centraliza o mapeamento
     * pra ser usado em qualquer controller que precise devolver dados do User.
     */
    public static UserResponseDTO fromUser(User u) {
        return new UserResponseDTO(
            u.getUserId(),
            u.getNome(),
            u.getEmail(),
            u.getTelefone(),
            u.getDataNasc(),
            u.getRole()
        );
    }
}
