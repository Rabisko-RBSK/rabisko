package com.rabisko.mvp.shared.infraestrutura.security;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.core.convert.converter.Converter;

@Component
public class SupabaseJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Map<String, Object> appMetadata = jwt.getClaimAsMap("app_metadata");
        String papel = appMetadata == null ? null : (String) appMetadata.get("role");

        var usuario = new UsuarioLogado(UUID.fromString(jwt.getSubject()), papel, jwt.getClaimAsString("email"));
        return new UsernamePasswordAuthenticationToken(usuario, jwt, authorities(papel));
    }

    private List<GrantedAuthority> authorities(String papel) {
        if (papel == null) return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        return switch (papel) {
            case "admin"    -> List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"));
            case "cliente"  -> List.of(new SimpleGrantedAuthority("ROLE_CLIENT"));
            case "tatuador" -> List.of(new SimpleGrantedAuthority("ROLE_TATUADOR"));
            case "estudio"  -> List.of(new SimpleGrantedAuthority("ROLE_ESTUDIO"));
            default         -> List.of(new SimpleGrantedAuthority("ROLE_USER"));
        };
    }

}

