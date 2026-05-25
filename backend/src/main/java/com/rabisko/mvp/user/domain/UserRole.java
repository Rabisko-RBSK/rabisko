package com.rabisko.mvp.user.domain;

// =====================================================================
// ENUM UserRole — os 4 papeis possiveis de um usuario.
//
// O que e um enum?
//   Um tipo Java com um conjunto FIXO de valores. Aqui temos exatamente
//   4 opcoes: admin, cliente, tatuador, estudio. Nao da pra inventar
//   um quinto fora dessa lista (seguranca de tipos).
//
// Por que os nomes estao em minusculo?
//   A convencao Java seria SCREAMING_SNAKE_CASE (CLIENTE, TATUADOR...).
//   Quebramos a convencao aqui de proposito porque o banco Postgres tem
//   um ENUM nativo chamado `user_role` com exatamente esses valores em
//   minusculo. O Hibernate serializa o enum chamando `.name()` (ex.:
//   UserRole.cliente.name() = "cliente") e manda direto pro banco —
//   tem que bater letra por letra, senao da erro de mapeamento.
//
// Diferenca de nomenclatura entre back e front:
//   No backend chamamos de "tatuador". No app (mobile) chamamos de
//   "artista". O front faz a traducao no LoginScreen/RegisterScreen
//   (helper backendRoleToFront).
// =====================================================================
public enum UserRole {
    admin,       // staff interno (futuro)
    cliente,     // pessoa que contrata tatuagem
    tatuador,    // profissional tatuador
    estudio      // dono/conta de um estudio de tatuagem
}
