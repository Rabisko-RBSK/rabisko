package com.rabisko.mvp.artist.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * Um dia aberto da semana. Os horarios trafegam como "HH:mm" (sem segundos).
 * Regras que envolvem a semana inteira (dia repetido, fecha > abre) ficam no
 * ValidadorHorarios.
 */
public record HorarioDiaDTO(
        @NotNull
        @Min(value = 1, message = "dia_semana deve ser de 1 (segunda) a 7 (domingo)")
        @Max(value = 7, message = "dia_semana deve ser de 1 (segunda) a 7 (domingo)")
        Integer diaSemana,

        @NotNull
        @JsonFormat(pattern = "HH:mm")
        LocalTime abre,

        @NotNull
        @JsonFormat(pattern = "HH:mm")
        LocalTime fecha
) {
    public static HorarioDiaDTO fromEntity(HorarioFuncionamento h) {
        return new HorarioDiaDTO((int) h.getDiaSemana(), h.getAbre(), h.getFecha());
    }
}
