package com.rabisko.mvp.shared.infraestrutura.security;

import java.security.Principal;
import java.util.UUID;

public record UsuarioLogado(
    UUID authId, 
    String papel, 
    String email
) implements Principal{
    @Override
    public String getName() {
        return authId.toString();
    }
}
