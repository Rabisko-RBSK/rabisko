package com.rabisko.mvp.studio.domain;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;

/** Perfil do estúdio logado (GET /studio/me/perfil). CNPJ não é editável. */
public record EstudioPerfilDTO(
        String nome,
        String cnpj,
        CnpjStatus cnpjStatus,
        String telefone,
        String fotoUrl,
        EnderecoDTO endereco,
        int posicoes
) {}
