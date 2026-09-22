package com.rabisko.mvp.estilo.controller;

import com.rabisko.mvp.estilo.domain.EstiloDTO;
import com.rabisko.mvp.estilo.service.EstiloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


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
