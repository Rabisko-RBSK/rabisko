package com.rabisko.mvp.client.service;

import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public Client cadastrarCliente(User user) {
        Client novoClient = Client.builder()
                .userId(user.getUserId())
                .build();

        return clientRepository.save(novoClient);
    }
}
