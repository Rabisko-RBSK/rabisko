package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.studio.RegisterEstudioDTO;
import com.rabisko.mvp.domain.studio.Studio;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.repositories.StudioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// =====================================================================
// SERVICE StudioService — cria a linha em `estudios` no cadastro.
//
// Espelho do ClientService/ArtistService, mas com dois detalhes:
//
//   1) nome/email viajam JUNTO com os campos especificos (cnpj, endereco)
//      mesmo ja existindo no User dono. Por que? Porque sao dados
//      COMERCIAIS do estudio — podem divergir do dono no futuro
//      (nome fantasia, email comercial). No cadastro inicial sao
//      iguais ao User, mas viram independentes quando a tela de
//      "editar estudio" existir.
//
//   2) Nao mexe com cpf/dataNasc (estudio e pessoa juridica).
// =====================================================================

@Service
public class StudioService {

    @Autowired
    private StudioRepository studioRepository;

    public Studio cadastrarEstudio(User user, RegisterEstudioDTO body) {
        Studio novoStudio = Studio.builder()
                .userId(user.getUserId())
                .nome(user.getNome())          // copia do User no cadastro
                .email(user.getEmail())        // copia do User no cadastro
                .cnpj(body.getCnpj())
                .telefone(body.getTelefone())
                .endereco(body.getEndereco())
                .build();

        return studioRepository.save(novoStudio);
    }
}
