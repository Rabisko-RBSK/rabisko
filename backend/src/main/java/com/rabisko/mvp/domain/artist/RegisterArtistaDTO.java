package com.rabisko.mvp.domain.artist;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

// =====================================================================
// DTO RegisterArtistaDTO — entrada do POST /user/cadastro/artista.
//
// Junta os campos do User base (nome/email/senha/...) + os campos
// exclusivos de Artist (bio, instagram, endereco, estilos). O backend
// monta as duas entidades (User + Artist) a partir desse DTO so.
//
// O `role` NAO vem aqui: e definido implicitamente pela URL do endpoint
// (/cadastro/artista -> role = tatuador). Isso impede que alguem se
// cadastre como ADMIN forjando o JSON.
// =====================================================================

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

    // ----- Campos especificos do Artist (perfil tatuador) -----

    private String bio;            // texto livre sobre o profissional

    private String instagram;      // @handle

    private String endereco;       // relevante quando o tatuador e autonomo (sem estudio)

    /**
     * Lista de NOMES de estilos que o tatuador faz (ex.: ["Realismo", "Blackwork"]).
     * O ArtistService resolve cada nome pra um id consultando a tabela `estilos`
     * e popula a juncao M:N `tatuador_estilos`.
     */
    private List<String> estilos;

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;
}
