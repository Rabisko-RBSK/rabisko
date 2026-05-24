package com.rabisko.mvp.domain.user;

// =====================================================================
// DTO LoginResponseDTO — resposta dos endpoints de login e cadastro.
//
// Devolve APENAS o token JWT — nenhum dado do usuario. O front guarda
// esse token (no AsyncStorage) e depois manda ele no header
// `Authorization: Bearer <token>` em toda chamada autenticada.
//
// Pra ter os dados do User logado, o front chama GET /user/me com
// o token. Isso mantem o login enxuto e o /me como fonte unica da
// verdade sobre o usuario atual.
// =====================================================================
public record LoginResponseDTO(String token) {
}
