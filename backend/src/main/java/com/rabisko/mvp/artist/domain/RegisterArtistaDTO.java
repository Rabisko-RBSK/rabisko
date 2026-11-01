package com.rabisko.mvp.artist.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

import org.hibernate.validator.constraints.br.CPF;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;


@Getter
@Setter
public class RegisterArtistaDTO {

    @NotBlank
    private String nome;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String senha;

    private String telefone;

    private LocalDate dataNasc;

    @NotBlank
    @CPF
    private String cpf;

    @Valid
    private EstudioSoloDTO estudioSolo;

    private String bio;

    private String instagram;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
