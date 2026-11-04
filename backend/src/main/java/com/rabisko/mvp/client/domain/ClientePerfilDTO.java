package com.rabisko.mvp.client.domain;

import java.time.LocalDate;

/** Perfil do cliente logado (GET /client/me). E-mail vem do login; CPF não é editável. */
public record ClientePerfilDTO(
        String nome,
        String email,
        String telefone,
        LocalDate dataNasc,
        String cpf
) {
    public static ClientePerfilDTO from(Client c, String email) {
        return new ClientePerfilDTO(c.getNome(), email, c.getTelefone(), c.getDataNasc(), c.getCpf());
    }
}
