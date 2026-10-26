package com.rabisko.mvp;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Guarda a correção de fuso: sem o TimeZone.setDefault do MvpApplication, um
 * servidor em UTC grava "14:00" como 14:00 UTC (11:00 de Brasília) e reservas
 * nas próximas 3h falham em chk_data_futura. Já se perdeu uma vez num merge.
 */
class FusoHorarioTest {

    @Test
    void aplicacaoRodaNoHorarioDeBrasilia() throws Exception {
        Class.forName(MvpApplication.class.getName()); // garante o bloco estático

        assertEquals("America/Sao_Paulo", MvpApplication.FUSO);
        assertEquals(ZoneId.of("America/Sao_Paulo"), TimeZone.getDefault().toZoneId());
        assertEquals(ZoneId.of("America/Sao_Paulo"), ZoneId.systemDefault());
    }

    @Test
    void localDateTimeVaiParaOInstanteCorretoDeBrasilia() throws Exception {
        Class.forName(MvpApplication.class.getName());

        // Mesma conversão que o driver faz ao gravar LocalDateTime em timestamptz.
        LocalDateTime sessao = LocalDateTime.parse("2026-11-10T14:00");
        assertEquals("2026-11-10T17:00:00Z", sessao.atZone(ZoneId.systemDefault()).toInstant().toString());
    }
}
