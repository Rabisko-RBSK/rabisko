package com.rabisko.mvp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// =====================================================================
// MvpApplication — PONTO DE ENTRADA do backend.
//
// Quando voce roda `mvn spring-boot:run`, e essa classe que e executada
// primeiro. O `main` chama SpringApplication.run, que:
//
//   1) Sobe o servidor Tomcat embarcado na porta 8080
//   2) Escaneia o classpath atras de classes com @Component, @Service,
//      @Repository, @Controller, @Configuration, etc. e as registra
//      como beans no "container" do Spring
//   3) Conecta no banco (Hibernate inicializa, valida o schema, ...)
//   4) Aplica auto-configuracoes (security, web, jpa, websocket, ...)
//
// @SpringBootApplication e uma anotacao "combo": equivale a
//   @Configuration + @EnableAutoConfiguration + @ComponentScan
// Ela diz "essa e a raiz da minha aplicacao Spring Boot".
//
// ComponentScan escaneia a partir do PACOTE desta classe (com.rabisko.mvp)
// e suas SUBPASTAS — por isso todas as outras classes estao em pacotes
// abaixo desse: controller, service, repositories, domain, infraestrutura.
// =====================================================================
@SpringBootApplication
public class MvpApplication {
	public static void main(String[] args) {
		SpringApplication.run(MvpApplication.class, args);
	}
}
