package com.rabisko.mvp.shared.infraestrutura.security;

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
import org.springframework.security.config.Customizer;


@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    SecurityFilter securityFilter;

    /**
     * Bean principal: declara a "regra de filtros" do Spring Security
     * pra TODAS as requisicoes HTTP.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .cors(Customizer.withDefaults())
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

                // .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
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
