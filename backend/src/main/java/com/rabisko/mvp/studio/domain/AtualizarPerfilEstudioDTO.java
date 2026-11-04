package com.rabisko.mvp.studio.domain;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Corpo do PATCH /studio/me/perfil: o formulário manda todos os campos editáveis. */
public record AtualizarPerfilEstudioDTO(
        @NotBlank @Size(max = 150) String nome,
        String telefone,
        @NotNull @Valid EnderecoDTO endereco
) {}
