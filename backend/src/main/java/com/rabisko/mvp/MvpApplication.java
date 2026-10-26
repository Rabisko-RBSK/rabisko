package com.rabisko.mvp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class MvpApplication {

	/**
	 * Fuso da aplicacao. Os horarios trafegam como LocalDateTime (sem offset):
	 * o app envia/exibe horario de Brasilia e o pgjdbc abre a sessao no fuso
	 * padrao da JVM para converter LocalDateTime <-> timestamptz. Sem isso, num
	 * servidor em UTC, "14:00" era gravado como 14:00 UTC (11:00 de Brasilia).
	 * Mesmo fuso fixado nas funcoes SQL do dashboard do estudio.
	 */
	public static final String FUSO = "America/Sao_Paulo";

	// Bloco estatico (e nao so no main) para valer tambem no @SpringBootTest e
	// antes de qualquer conexao com o banco.
	static {
		TimeZone.setDefault(TimeZone.getTimeZone(FUSO));
	}

	public static void main(String[] args) {
		SpringApplication.run(MvpApplication.class, args);
	}
}
