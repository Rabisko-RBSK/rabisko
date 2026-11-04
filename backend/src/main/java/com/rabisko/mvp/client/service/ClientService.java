package com.rabisko.mvp.client.service;

import com.rabisko.mvp.client.domain.AtualizarClienteDTO;
import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.domain.ClientePerfilDTO;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.shared.validacao.Telefone;
import com.rabisko.mvp.user.domain.UserDTO;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    public ClientePerfilDTO meuPerfil(UsuarioLogado logado) {
        return ClientePerfilDTO.from(exigirCliente(logado), logado.email());
    }

    @Transactional
    public ClientePerfilDTO atualizarPerfil(UsuarioLogado logado, AtualizarClienteDTO body) {
        Client cliente = exigirCliente(logado);
        cliente.setNome(body.nome().trim());
        cliente.setTelefone(Telefone.normalizar(body.telefone()));
        cliente.setDataNasc(body.dataNasc());
        return ClientePerfilDTO.from(clientRepository.save(cliente), logado.email());
    }

    private Client exigirCliente(UsuarioLogado logado) {
        if (!"cliente".equals(logado.papel())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas clientes tem este perfil");
        }
        return clientRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil cliente nao encontrado"));
    }
}
