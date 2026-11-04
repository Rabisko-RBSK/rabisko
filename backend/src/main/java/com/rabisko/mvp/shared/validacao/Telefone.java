package com.rabisko.mvp.shared.validacao;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Telefone guardado só com dígitos (DDD + número). */
public final class Telefone {

    private Telefone() {}

    /** Vazio vira null; com dígitos, exige 10 (fixo) ou 11 (celular). */
    public static String normalizar(String telefone) {
        if (telefone == null || telefone.isBlank()) return null;
        String digitos = telefone.replaceAll("\\D", "");
        if (digitos.length() != 10 && digitos.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "telefone deve ter 10 ou 11 digitos");
        }
        return digitos;
    }
}
