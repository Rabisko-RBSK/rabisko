package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.estilo.EstiloDTO;
import com.rabisko.mvp.repositories.EstiloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Servico do catalogo `estilos`. Por enquanto so expoe `listar()` (consumido
 * pelo autocomplete do front). Catalogo e pequeno e raramente muda — sem
 * paginacao/cache server-side; o mobile mantem o cache em memoria de processo.
 */
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
