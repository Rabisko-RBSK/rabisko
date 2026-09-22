package com.rabisko.mvp.estilo.service;

import com.rabisko.mvp.estilo.domain.EstiloDTO;
import com.rabisko.mvp.estilo.repository.EstiloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;


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
