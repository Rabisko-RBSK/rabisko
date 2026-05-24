package com.rabisko.mvp.domain.user;

// =====================================================================
// DTO AuthenticationDTO — entrada do POST /auth/login.
//
// O que e um `record` em Java?
//   record e um atalho pra criar classes IMUTAVEIS de transporte de
//   dados. Esta linha:
//
//       public record AuthenticationDTO(String login, String senha) {}
//
//   gera automaticamente:
//     - construtor: new AuthenticationDTO("a@b.com", "1234")
//     - getters: dto.login(), dto.senha()  (note: SEM "get")
//     - equals, hashCode, toString
//
//   Como todos os campos sao final, o objeto nao pode ser modificado
//   depois de criado — perfeito pra DTOs.
//
// `login` aqui = email do User. O nome "login" e generico pra nao
// vazar a decisao de "qual campo e usado pra autenticar".
// =====================================================================
public record AuthenticationDTO(String login, String senha) {
}
