package com.rabisko.mvp.client.service;

import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.user.domain.UserDTO;

import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    @Transactional
    public Client cadastrarCliente(UUID authId, UserDTO body) {
        Client novoClient = Client.builder()
        .authId(authId)
        .nome(body.getNome())
        .telefone(body.getTelefone())
        .dataNasc(body.getDataNasc())
        .cpf(body.getCpf())
        .termosAceitos(body.isTermosAceitos())
        .build();


        return clientRepository.save(novoClient);
    }
}
