package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.estilo.EstiloDTO;
import com.rabisko.mvp.service.EstiloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// =====================================================================
// CONTROLLER EstiloController — endpoints do catalogo `estilos`.
//
// Hoje so existe um: GET /estilos (lista todos).
//
// Usado pelo autocomplete da busca no app. O front cacheia em memoria,
// entao chamamos uma vez quando o app sobe.
//
// AUTH: herda o padrao -> exige JWT valido.
// =====================================================================

@RestController
@RequestMapping("/estilos")
public class EstiloController {

    @Autowired
    private EstiloService estiloService;

    /**
     * @GetMapping (sem path) significa: responde GET na raiz do
     * @RequestMapping da classe -> GET /estilos
     */
    @GetMapping
    public ResponseEntity<List<EstiloDTO>> listar() {
        return ResponseEntity.ok(estiloService.listar());
    }
}
