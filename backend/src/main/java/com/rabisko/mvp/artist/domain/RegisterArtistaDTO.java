package com.rabisko.mvp.artist.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

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

    private String cpf;

    @Valid
    @NotNull
    private EnderecoDTO endereco;

    private String bio;

    private String instagram;

    private List<String> estilos;

    /** Dias abertos da semana; obrigatorio ter ao menos um. */
    @Valid
    @NotEmpty(message = "Informe ao menos um dia de atendimento")
    private List<HorarioDiaDTO> horarios;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
