package com.rabisko.mvp.service;

import com.rabisko.mvp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// =====================================================================
// SERVICE AuthorizationService — ponte entre nosso banco e o Spring Security.
//
// Quando alguem faz POST /auth/login com email+senha, o Spring Security
// precisa de uma forma de "buscar o usuario pelo username". Pra ensinar
// isso a ele, implementamos a interface UserDetailsService, que tem
// EXATAMENTE 1 metodo: loadUserByUsername(String).
//
// Aqui, "username" = email (porque User.getUsername() devolve o email).
// Devolvemos UserDetails — interface que o Spring Security entende. Como
// nossa classe User ja implementa UserDetails, podemos retornar ela direta.
//
// Esse service nao e chamado pelos NOSSOS controllers; quem chama e o
// AuthenticationManager do Spring (configurado em SecurityConfiguration),
// internamente, durante o login.
// =====================================================================

@Service          // diz ao Spring: registre essa classe como bean injetavel
public class AuthorizationService implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username);
    }
}
