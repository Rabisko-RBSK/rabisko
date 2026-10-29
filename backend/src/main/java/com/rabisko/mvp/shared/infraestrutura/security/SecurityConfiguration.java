package com.rabisko.mvp.shared.infraestrutura.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;


@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired 
    SupabaseJwtConverter supabaseJwtConverter;
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
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/cliente").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/artista").permitAll()
                        .requestMatchers(HttpMethod.POST, "/user/cadastro/estudio").permitAll()
                        .requestMatchers("/wss/**").permitAll()
                        .requestMatchers("/simulation/**").permitAll()
                        .requestMatchers("/studio/**").hasRole("ESTUDIO")
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(supabaseJwtConverter)))
                .build();
    }
}
