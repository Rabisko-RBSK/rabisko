package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.client.Client;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.repositories.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// =====================================================================
// SERVICE ClientService — cria a linha em `clientes` no cadastro.
//
// E o servico mais simples do sistema: cliente nao tem nenhum campo
// proprio no momento do cadastro — so o vinculo com o User. O token
// de pagamento (`dadosPagamentoToken`) entra depois, quando o usuario
// cadastrar um cartao na tela de configuracoes.
//
// Por isso recebe so o User salvo (nao um DTO): nao ha nada extra
// do payload pra processar aqui.
// =====================================================================

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public Client cadastrarCliente(User user) {
        Client novoClient = Client.builder()
                .userId(user.getUserId())     // unica coisa que importa: linkar ao User
                .build();

        return clientRepository.save(novoClient);
    }
}
