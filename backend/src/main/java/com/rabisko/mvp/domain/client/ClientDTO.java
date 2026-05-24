package com.rabisko.mvp.domain.client;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

// =====================================================================
// DTO ClientDTO — usado para rotas futuras de pagamento (cadastrar/
// editar metodo de pagamento do cliente).
//
// NAO e o DTO de cadastro: cliente nao tem campos exclusivos no momento
// do cadastro — usa UserDTO. O ClientService cria a linha em `clientes`
// automaticamente depois de salvar o User, so com o userId.
// =====================================================================
@Getter
@Setter
public class ClientDTO {

    private UUID clientId;
    private UUID userId;
    private String dadosPagamentoToken;   // token retornado pelo gateway (Mercado Pago/Stripe)
}
