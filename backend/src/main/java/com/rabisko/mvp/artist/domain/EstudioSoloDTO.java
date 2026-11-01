package com.rabisko.mvp.artist.domain;

import org.hibernate.validator.constraints.br.CNPJ;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EstudioSoloDTO(
    @NotBlank @Size(max = 150) String nome,
    @CNPJ @NotNull String cnpj,
    @Valid @NotNull EnderecoDTO endereco
) {}

