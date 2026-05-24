package com.rabisko.mvp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// =====================================================================
// MvpApplicationTests — teste minimo de SMOKE da aplicacao.
//
// O que esse teste valida?
//   So uma coisa: que o "context" do Spring SOBE sem erros. Em outras
//   palavras, que TODAS as anotacoes (@Service, @Repository,
//   @Controller, @Configuration), todos os beans, todas as @Value, etc.
//   conseguem ser carregadas sem o Spring reclamar.
//
// E util porque:
//   - Pega erros bobos como typo em @Value, bean nao encontrado,
//     ciclo de dependencia, etc. SEM precisar levantar o servidor.
//   - Roda em segundos.
//
// Como rodar:
//   ./mvnw test -Dtest=MvpApplicationTests#contextLoads
//
// Importante: o @SpringBootTest tenta CONECTAR no banco quando sobe
// (porque temos JPA configurado). Pra rodar offline, precisaria de um
// profile de teste com H2 ou similar — nao temos isso configurado.
// =====================================================================

@SpringBootTest
class MvpApplicationTests {

    @Test
    void contextLoads() {
        // Vazio de proposito: se o @SpringBootTest carregou sem excecao,
        // o teste ja passou. Esse e o "smoke test" classico.
    }
}
