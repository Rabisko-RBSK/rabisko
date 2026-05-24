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

// =====================================================================
// CONFIG SecurityConfiguration — regras de seguranca da API.
//
// O que esse arquivo define:
//   1) Quais URLs sao PUBLICAS (sem login)
//   2) Quais URLs exigem JWT valido
//   3) Como tratar sessao (no nosso caso: NAO ter sessao = stateless)
//   4) Onde encaixar o NOSSO filtro JWT na pipeline de filtros do Spring
//   5) Beans utilitarios: AuthenticationManager (pra validar login) e
//      PasswordEncoder (BCrypt — pra fazer hash/compare de senha)
//
// Pipeline simplificada de uma request HTTP:
//
//   request -> [SecurityFilter (le o JWT)]
//           -> [UsernamePasswordAuthenticationFilter (no-op aqui)]
//           -> Controller (ja com @AuthenticationPrincipal disponivel)
//
// "Stateless" significa que o servidor NAO guarda sessao em memoria —
// cada request precisa carregar o JWT no header. Vantagem: escala
// horizontal sem precisar de "sticky session" no load balancer.
// =====================================================================

@Configuration            // diz ao Spring: essa classe define beans/config
@EnableWebSecurity        // ativa o Spring Security e permite customizar
public class SecurityConfiguration {

    @Autowired
    SecurityFilter securityFilter;       // nosso filtro JWT custom

    /**
     * Bean principal: declara a "regra de filtros" do Spring Security
     * pra TODAS as requisicoes HTTP.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                // CSRF desligado: so faz sentido com cookies de sessao;
                // como usamos JWT no header, nao tem o que proteger.
                .csrf(csrf -> csrf.disable())

                // STATELESS: nao gera HttpSession nenhuma.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Regras de autorizacao por URL — a ordem importa!
                // permitAll = liberado sem login. anyRequest().authenticated()
                // = tudo que nao for explicitamente liberado exige JWT.
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/cliente").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/artista").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/estudio").permitAll()
                        .requestMatchers("/wss/**").permitAll()        // handshake do WebSocket — auth e via STOMP CONNECT
                        .requestMatchers("/simulation/**").permitAll() // endpoint de simulacao de tattoo (sem login)
                        .anyRequest().authenticated())

                // Insere NOSSO filtro JWT ANTES do filtro de login padrao
                // do Spring. Assim o SecurityContext ja chega populado.
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Expoe o AuthenticationManager como bean pra que o AuthenticationControler
     * possa injeta-lo e chamar `authenticate(usernamePasswordToken)`. Esse
     * cara que checa email+senha contra o banco no /auth/login.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * BCrypt: algoritmo de hashing de senhas. Usado em dois lugares:
     *   - Cadastro    : UserService.cadastrar* faz `encode(senha)` antes de salvar
     *   - Login       : Spring compara automaticamente a senha digitada com o
     *                   hash salvo via `matches(plain, hash)` por baixo dos panos
     *
     * NUNCA guardar senha em texto puro. BCrypt embute salt no hash, entao
     * dois usuarios com mesma senha geram hashes diferentes.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
