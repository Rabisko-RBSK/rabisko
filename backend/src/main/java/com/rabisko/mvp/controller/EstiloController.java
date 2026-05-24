package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.estilo.EstiloDTO;
import com.rabisko.mvp.service.EstiloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoint publico do catalogo de estilos. Hoje so o /listar (GET /estilos).
 *
 * Auth: herda do SecurityConfiguration — qualquer endpoint que NAO seja
 * /auth/login ou /user/cadastro/* exige Bearer. O front sempre chama esse
 * endpoint depois do login, entao o token ja esta disponivel.
 */
@RestController
@RequestMapping("/estilos")
public class EstiloController {

    @Autowired
    private EstiloService estiloService;

    @GetMapping
    public ResponseEntity<List<EstiloDTO>> listar() {
        return ResponseEntity.ok(estiloService.listar());
    }
}
