package com.rabisko.mvp.shared.infraestrutura.security;

import com.rabisko.mvp.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// =====================================================================
// FILTER SecurityFilter — le o JWT do header e identifica o usuario.
//
// Esse filtro roda em TODA requisicao HTTP (antes do controller).
//
// O que ele faz, passo a passo:
//   1) Le o header `Authorization: Bearer <jwt>`
//   2) Pede ao TokenService pra validar/decodificar o JWT
//   3) Pega o email (subject do token) e busca o User no banco
//   4) Cria um Authentication do Spring e poe no SecurityContextHolder
//
// Depois desse filtro, qualquer controller que usar
// @AuthenticationPrincipal User user ja recebe o usuario logado.
//
// IMPORTANTE: se o token for invalido OU se nao houver header, esse
// filtro NAO bloqueia a request — apenas nao seta usuario. Quem decide
// bloquear e o SecurityConfiguration (.anyRequest().authenticated()).
// Isso evita que rotas publicas (login/cadastro) parem de funcionar
// quando o cliente nao manda token.
//
// OncePerRequestFilter: classe utilitaria do Spring que garante que
// o doFilter rode EXATAMENTE 1 vez por requisicao (mesmo se houver
// forwards internos).
// =====================================================================

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        var token = this.recoverToken(request);

        // So tenta autenticar se o cliente mandou algum token. Se nao mandou,
        // segue em frente sem autenticar — rotas publicas continuam funcionando.
        if (token != null && !token.isBlank()) {
            var login = tokenService.validateToken(token);   // devolve o email se OK, "" se invalido
            if (!login.isEmpty()) {
                UserDetails user = userRepository.findByEmail(login);
                if (user != null) {
                    // Cria o Authentication do Spring:
                    //   principal    = o User (vira o @AuthenticationPrincipal)
                    //   credentials  = null (nao guarda senha em memoria)
                    //   authorities  = roles vindos de User.getAuthorities()
                    var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        // Passa adiante na chain — proximo filtro / controller.
        filterChain.doFilter(request, response);
    }

    /**
     * Le o header Authorization e devolve so o token (sem o "Bearer ").
     * Retorna null se o header nao existe.
     */
    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        return authHeader.replace("Bearer ", "");
    }
}
