package com.rabisko.mvp.domain.estilo;

import java.util.UUID;

/**
 * RESPONSE DTO de Estilo — usado pelo GET /estilos pra alimentar o
 * autocomplete da barra de busca no mobile. So id + nome porque
 * `descricao`/`dataCriacao` nao tem uso no front (autocomplete + did-you-mean).
 *
 * Manter sincronizado com Estilo.java caso novos campos publicos surjam.
 */
public record EstiloDTO(
        UUID estiloId,
        String nome
) {
    public static EstiloDTO fromEntity(Estilo e) {
        return new EstiloDTO(e.getEstiloId(), e.getNome());
    }
}
