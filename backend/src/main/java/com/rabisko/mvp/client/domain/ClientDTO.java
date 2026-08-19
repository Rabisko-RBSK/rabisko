package com.rabisko.mvp.client.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ClientDTO {

    private UUID clientId;
    private UUID userId;
    private String dadosPagamentoToken;
}
