package com.rabisko.mvp.client.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Corpo do PATCH /client/me: o formulário manda todos os campos editáveis. */
public record AtualizarClienteDTO(
        @NotBlank @Size(max = 150) String nome,
        String telefone,
        @Past LocalDate dataNasc
) {}
