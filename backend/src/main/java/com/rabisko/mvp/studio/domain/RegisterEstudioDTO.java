package com.rabisko.mvp.studio.domain;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class RegisterEstudioDTO {

    @NotBlank
    private String nome;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String senha;

    private String telefone;

    private String cnpj;

    /** Opcional: sem valor, o estudio e criado com 1 posicao. */
    @Min(value = 1, message = "O estudio precisa de ao menos 1 posicao")
    @Max(value = 50, message = "O estudio pode ter no maximo 50 posicoes")
    private Integer posicoes;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
