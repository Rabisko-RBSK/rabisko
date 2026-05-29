package com.rabisko.mvp.estilo.domain;

import java.util.UUID;

// =====================================================================
// DTO EstiloDTO — resposta do GET /estilos.
//
// Usado pra alimentar o autocomplete da barra de busca no mobile.
// So id + nome porque o front nao precisa da descricao nem da data
// pra mostrar uma sugestao.
// =====================================================================
public record EstiloDTO(
        UUID estiloId,
        String nome
) {
    public static EstiloDTO fromEntity(Estilo e) {
        return new EstiloDTO(e.getEstiloId(), e.getNome());
    }
}
