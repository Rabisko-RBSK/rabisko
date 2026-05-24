package com.rabisko.mvp.domain.studio;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// =====================================================================
// DTO RegisterEstudioDTO — entrada do POST /user/cadastro/estudio.
//
// Junta os campos do User base (credenciais de login do dono) com os
// campos do Studio (cnpj, endereco). O `nome` aqui e o NOME DO ESTUDIO
// — vai pra Studio.nome e tambem pra User.nome (no cadastro inicial os
// dois sao iguais; podem divergir depois via tela de edicao).
//
// dataNasc/cpf NAO entram: estudio e pessoa juridica — usa CNPJ.
// =====================================================================

@Getter
@Setter
public class RegisterEstudioDTO {

    @NotBlank
    private String nome;       // nome do estudio (e tambem do User dono)

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String senha;

    private String telefone;

    private String cnpj;       // opcional no MVP

    private String endereco;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
