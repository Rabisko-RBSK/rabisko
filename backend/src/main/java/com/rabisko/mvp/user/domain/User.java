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


@Entity
@Table(name = "users")

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = "userId")
public class User implements UserDetails {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;


    @Column(nullable = false)
    private String nome;

    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @Size(min = 8)
    @Column(name = "senha_hash", nullable = false)
    private String senha;

    private String telefone;

    @Column(name = "data_nasc")
    private LocalDate dataNasc;

    @Column(unique = true)
    private String cpf;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "role", columnDefinition = "user_role", nullable = false)
    private UserRole role;


    @Column(name = "status_ativo", nullable = false)
    private boolean status;

    @CreationTimestamp
    @Column(name = "data_criacao", updatable = false, nullable = false)
    private LocalDateTime dataCriacao;

    @UpdateTimestamp
    @Column(name = "data_modificacao", nullable = false)
    private LocalDateTime dataModificacao;

    @Column(name = "termos_aceitos", nullable = false)
    private boolean termosAceitos;



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
        return this.senha;
    }

    /** "username" do Spring = nosso email. E o que vai dentro do JWT (subject). */
    @Override
    public String getUsername() {
        return email;
    }

    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}
