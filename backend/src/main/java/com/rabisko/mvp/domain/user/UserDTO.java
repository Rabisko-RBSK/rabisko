package com.rabisko.mvp.domain.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// =====================================================================
// DTO UserDTO — entrada do POST /user/cadastro/cliente.
//
// O que e um DTO?
//   DTO = Data Transfer Object (Objeto de Transferencia de Dados).
//   E um objeto SIMPLES (so atributos, sem logica) usado pra mover
//   dados entre camadas — neste caso, entre a API HTTP e a camada
//   de servico (UserService).
//
// Por que nao receber direto um User?
//   1) Seguranca: campos como `role`, `userId`, `status` nao devem
//      vir do cliente — se viessem, um usuario malicioso poderia se
//      cadastrar como ADMIN. Deixar de fora ja resolve.
//   2) Acoplamento: o User e o que vai pro banco; o DTO e o que vem
//      da rede. Mudar um nao deve quebrar o outro.
//
// Validacoes (anotacoes do Jakarta Bean Validation):
//   @NotBlank   = nao pode ser null, vazio ou so espacos
//   @Email      = formato basico de email valido
//   @Size       = tamanho minimo/maximo
//   @AssertTrue = boolean tem que ser true
//
// Essas validacoes rodam quando o controller marca o parametro com
// @Valid. Se algo falhar, o Spring devolve HTTP 400 automatico.
// =====================================================================

@Getter
@Setter
public class UserDTO {

    @NotBlank
    private String nome;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String senha;             // senha em texto puro — o UserService faz o hash antes de salvar

    private String telefone;          // opcional

    private LocalDate dataNasc;       // opcional

    private String cpf;               // opcional no MVP

    @AssertTrue(message = "Voce deve aceitar os termos de uso")
    private boolean termosAceitos;    // obriga marcar o checkbox
}
