package com.rabisko.mvp.user.domain;

// =====================================================================
// DTO ExcludeDTO — entrada do DELETE /user/excluir-conta.
//
// So precisa do email pra identificar qual conta excluir. O UserService
// faz findByEmail e remove (ou marca como inativa, dependendo da regra).
// =====================================================================
public record ExcludeDTO(String email) {
}
