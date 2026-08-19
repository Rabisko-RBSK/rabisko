package com.rabisko.mvp.artist.domain;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;


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


    private String bio;

    private String instagram;

    private String endereco;

    /**
     * Lista de NOMES de estilos que o tatuador faz (ex.: ["Realismo", "Blackwork"]).
     * O ArtistService resolve cada nome pra um id consultando a tabela `estilos`
     * e popula a juncao M:N `tatuador_estilos`.
     */
    private List<String> estilos;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
