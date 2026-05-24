package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.estilo.EstiloDTO;
import com.rabisko.mvp.repositories.EstiloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

// =====================================================================
// SERVICE EstiloService — expoe a lista do catalogo de estilos.
//
// Por enquanto so 1 metodo: `listar()`, ordenando por nome. O resultado
// alimenta o autocomplete da busca no app.
//
// Sem paginacao porque o catalogo e PEQUENO (dezenas de itens, nao
// milhares). O mobile guarda em memoria depois da primeira chamada.
// =====================================================================

@Service
public class EstiloService {

    @Autowired
    private EstiloRepository estiloRepository;

    public List<EstiloDTO> listar() {
        return estiloRepository.findAll(Sort.by("nome")).stream()
                .map(EstiloDTO::fromEntity)
                .toList();
    }
}
