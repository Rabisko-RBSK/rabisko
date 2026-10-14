package com.rabisko.mvp.studio.domain;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record ContratoInputDTO(
        @NotNull ContratoModelo modelo,
        @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 2) BigDecimal percentualEstudio,
        @DecimalMin(value = "0", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal valorFixo,
        ContratoPeriodicidade periodicidade,
        @Size(max = 500) String observacoes
) {
    @AssertTrue(message = "Comissao exige apenas percentualEstudio; aluguel e salario exigem apenas valorFixo e periodicidade")
    public boolean isCamposCompativeis() {
        if (modelo == null) return true;
        return switch (modelo) {
            case comissao -> percentualEstudio != null && valorFixo == null && periodicidade == null;
            case aluguel, salario -> valorFixo != null && periodicidade != null && percentualEstudio == null;
        };
    }

    public ContratoColaborador toEntity(UUID estudioId, UUID tatuadorId, UUID conviteId) {
        return ContratoColaborador.builder()
                .estudioId(estudioId)
                .tatuadorId(tatuadorId)
                .conviteId(conviteId)
                .modelo(modelo)
                .percentualEstudio(percentualEstudio)
                .valorFixo(valorFixo)
                .periodicidade(periodicidade)
                .observacoes(observacoes)
                .build();
    }
}
