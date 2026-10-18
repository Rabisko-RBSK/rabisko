package com.rabisko.mvp.endereco.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.rabisko.mvp.endereco.domain.Endereco;
import com.rabisko.mvp.endereco.domain.EnderecoDTO;
import com.rabisko.mvp.endereco.domain.EnderecoOwnerType;
import com.rabisko.mvp.endereco.repository.EnderecoRepository;

import jakarta.transaction.Transactional;

@Service
public class EnderecoService {

    @Autowired private EnderecoRepository enderecoRepository;

    @Transactional
    public Endereco salvar(UUID ownerId, EnderecoOwnerType ownerType, EnderecoDTO dto, UUID enderecoIdAtual){
        if(enderecoIdAtual == null){
            return enderecoRepository.save(dto.toEntity(ownerId, ownerType));
        }

        Endereco atual = enderecoRepository.findById(enderecoIdAtual).orElse(null);

        if(atual == null){
            return enderecoRepository.save(dto.toEntity(ownerId, ownerType));
        }

        dto.aplicarEm(atual);
        return enderecoRepository.save(atual);

    }

}
