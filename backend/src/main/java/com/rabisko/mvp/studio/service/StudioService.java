package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class StudioService {

    @Autowired
    private StudioRepository studioRepository;

    public Studio cadastrarEstudio(User user, RegisterEstudioDTO body) {
        Studio novoStudio = Studio.builder()
                .userId(user.getUserId())
                .nome(user.getNome())
                .email(user.getEmail())
                .cnpj(body.getCnpj())
                .telefone(body.getTelefone())
                .endereco(body.getEndereco())
                .build();

        return studioRepository.save(novoStudio);
    }
}
