package com.rabisko.mvp.horario.domain;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HorarioDTO(
    
    @Min(1) 
    @Max(7)
    int diaSemana, 

    @NotNull
    LocalTime abre, 

    @NotNull
    LocalTime fecha
) {
    @JsonIgnore
    @AssertTrue(message = "O horário de fechamento deve ser depois da abertura")
    public boolean isOrdemValida() {
        return abre == null || fecha == null || fecha.isAfter(abre);
    }

    public static HorarioDTO from(HorarioAtendimento h){
        return new HorarioDTO(
            h.getDiaSemana(),
            h.getAbre(),
            h.getFecha()
        );
    }
}
