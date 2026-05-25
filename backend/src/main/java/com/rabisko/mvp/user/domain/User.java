package com.rabisko.mvp.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

// =====================================================================
// ENTIDADE User — representa uma linha da tabela `users` no banco.
//
// O que e uma "entidade" (entity) em JPA/Hibernate?
//   Uma classe Java marcada com @Entity vira o "espelho" de uma tabela
//   do banco. Cada instancia da classe = uma linha da tabela.
//   Cada @Column = uma coluna. O Hibernate cuida da traducao
//   Java <-> SQL (SELECT, INSERT, UPDATE, DELETE) por baixo dos panos.
//
// Por que essa classe e a "central" do sistema?
//   TODO usuario do app (cliente, tatuador, dono de estudio, admin)
//   tem 1 linha em `users`. As tabelas `clientes`, `tatuadores` e
//   `estudios` carregam apenas os dados ESPECIFICOS daquele papel e
//   apontam pra cá via user_id.
//
// Por que implementa UserDetails?
//   UserDetails e a interface do Spring Security que diz
//   "isso aqui e um usuario autenticavel". Implementar ela permite que
//   o Spring use a propria classe User no fluxo de login/autorizacao,
//   sem precisar de um adaptador.
// =====================================================================

@Entity                     // diz ao Hibernate: essa classe vira tabela
@Table(name = "users")      // nome exato da tabela no banco (case-sensitive no Postgres)

// Anotacoes do Lombok — geram codigo automaticamente em tempo de compilacao
// para nao escrevermos getter/setter/construtores na mao:
@Getter                     // gera getNome(), getEmail(), ... pra cada campo
@Setter                     // gera setNome(...), setEmail(...), ...
@AllArgsConstructor         // gera um construtor recebendo TODOS os campos
@NoArgsConstructor          // gera um construtor SEM argumentos (JPA exige)
@Builder                    // gera o padrao Builder: User.builder().nome("x").build()
@EqualsAndHashCode(of = "userId")   // equals/hashCode considerando SO o id
public class User implements UserDetails {

    // ----- IDENTIDADE -----

    @Id                                         // marca este campo como chave primaria
    @GeneratedValue(strategy = GenerationType.UUID)  // o proprio Java gera um UUID quando salva
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;

    // ----- DADOS PESSOAIS -----

    @Column(nullable = false)
    private String nome;

    @Email                                       // validacao: precisa ter formato de email
    @Column(unique = true, nullable = false)     // banco rejeita 2 usuarios com mesmo email
    private String email;

    @Size(min = 8)                               // validacao na entrada: minimo 8 chars
    @Column(name = "senha_hash", nullable = false)
    // IMPORTANTE: aqui guardamos o HASH da senha (BCrypt), nunca a senha em texto puro.
    // Quem faz o hash e o UserService no cadastro.
    private String senha;

    private String telefone;

    @Column(name = "data_nasc")
    private LocalDate dataNasc;

    @Column(unique = true)
    // cpf e nullable: estudio (pessoa juridica) nao tem CPF, usa CNPJ na tabela `estudios`.
    private String cpf;

    // ----- PAPEL DO USUARIO -----
    //
    // O Postgres tem um tipo ENUM proprio chamado `user_role` (admin/cliente/
    // tatuador/estudio). Pra Hibernate enviar o valor no formato certo:
    //
    //   @Enumerated(STRING)                 -> serializa o enum como texto ("cliente")
    //   @JdbcTypeCode(SqlTypes.NAMED_ENUM)  -> avisa ao driver: "isso e um enum nomeado"
    //   columnDefinition = "user_role"      -> nome do tipo no banco
    //
    // Se faltar QUALQUER uma dessas 3, o driver envia varchar e o Postgres
    // reclama: "column is of type user_role but expression is of type varchar".
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "role", columnDefinition = "user_role", nullable = false)
    private UserRole role;

    // ----- METADADOS -----

    @Column(name = "status_ativo", nullable = false)
    // true = conta ativa; false = soft-delete (conta desativada mas registro mantido).
    private boolean status;

    @CreationTimestamp     // Hibernate preenche AUTOMATICAMENTE no INSERT (data de cadastro)
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @UpdateTimestamp       // Hibernate atualiza AUTOMATICAMENTE em todo UPDATE
    @Column(name = "data_modificacao", nullable = false)
    private LocalDateTime dataModificacao;

    @Column(name = "termos_aceitos", nullable = false)
    // Aceite e do USUARIO (pessoa), nao do papel. Por isso fica aqui e nao em tatuadores/clientes.
    private boolean termosAceitos;


    // =================================================================
    // METODOS DA INTERFACE UserDetails (Spring Security)
    //
    // Quando alguem faz login, o Spring chama estes metodos pra decidir:
    //   - "qual e o username?" -> getUsername() (no nosso caso, o email)
    //   - "qual e a senha hash pra comparar?" -> getPassword()
    //   - "esse usuario pode entrar?" -> isEnabled(), isAccountNonExpired(), ...
    //   - "quais permissoes ele tem?" -> getAuthorities()
    // =================================================================

    /**
     * Converte o nosso UserRole (enum do dominio) em GrantedAuthority
     * (formato que o Spring Security entende). Cada role vira uma string
     * "ROLE_X" — convenção que permite usar @PreAuthorize("hasRole('CLIENT')")
     * em endpoints depois.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == UserRole.admin)
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"));
        else if (this.role == UserRole.cliente)
            return List.of(new SimpleGrantedAuthority("ROLE_CLIENT"));
        else if (this.role == UserRole.tatuador)
            return List.of(new SimpleGrantedAuthority("ROLE_TATUADOR"));
        else
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public @Nullable String getPassword() {
        return this.senha;   // o Spring compara o hash que esta aqui com a senha digitada
    }

    /** "username" do Spring = nosso email. E o que vai dentro do JWT (subject). */
    @Override
    public String getUsername() {
        return email;
    }

    // Os 4 flags abaixo SEMPRE retornam true no MVP — nao temos logica
    // de expiracao de conta nem bloqueio por tentativas. Se um dia houver,
    // troque por leitura de colunas no banco.
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}
