package com.rabisko.mvp.infraestrutura.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuracao do Spring Security. Define a pipeline de seguranca da API:
 *
 * request --> [SecurityFilter (le JWT, popula SecurityContext)]
 * --> [UsernamePasswordAuthenticationFilter (no-op aqui, sessao stateless)]
 * --> Controller (com @AuthenticationPrincipal disponivel)
 *
 * Decisoes principais:
 * - STATELESS: nao cria HttpSession. Cada request carrega o JWT no header
 * Authorization. Permite escala horizontal sem sticky sessions.
 * - CSRF desabilitado: nao usamos cookies de sessao, entao o vetor CSRF
 * nao se aplica. Se um dia adicionar cookie auth, REVERTER esta linha.
 * - permitAll APENAS em /auth/login e /user/cadastro/{cliente|artista|estudio}.
 * Todas as outras rotas exigem JWT valido (.anyRequest().authenticated()).
 * - SecurityFilter inserido ANTES do UsernamePasswordAuthenticationFilter
 * pra que o SecurityContext ja esteja populado quando o controller rodar.
 *
 * Beans expostos:
 * - AuthenticationManager: usado pelo AuthenticationControler pra validar
 * credenciais no /auth/login.
 * - PasswordEncoder (BCrypt): hashing usado tanto no cadastro (UserService
 * armazena o hash) quanto na autenticacao (Spring compara senha plain
 * com o hash via DaoAuthenticationProvider).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/cliente").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/artista").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/estudio").permitAll()
                        .requestMatchers("/wss/**").permitAll()
                        .requestMatchers("/simulation/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
