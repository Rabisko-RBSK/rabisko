package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.AgendamentoInvalidoException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class TokenCheckinService {

    public static final long VALIDADE_SEGUNDOS = 120;

    public record TokenCheckin(String token, Instant expiraEm) {}
    public record DadosToken(UUID sessionId, UUID clienteId) {}

    @Value("${rabisko.checkin.secret}")
    private String segredo;

    public TokenCheckin gerar(UUID sessionId, UUID clienteId) {
        Instant expira = Instant.now().plusSeconds(VALIDADE_SEGUNDOS);
        String dados = sessionId + "|" + clienteId + "|" + expira.getEpochSecond();
        String token = base64(dados.getBytes(StandardCharsets.UTF_8)) + "." + base64(assinar(dados));
        return new TokenCheckin(token, expira);
    }

    public DadosToken validar(String token) {
        String[] partes = token == null ? new String[0] : token.split("\\.");
        if (partes.length != 2) throw new AgendamentoInvalidoException("QR code inválido.");

        String dados;
        try {
            dados = new String(Base64.getUrlDecoder().decode(partes[0]), StandardCharsets.UTF_8);
            byte[] assinatura = Base64.getUrlDecoder().decode(partes[1]);
            if (!MessageDigest.isEqual(assinar(dados), assinatura)) {
                throw new AgendamentoInvalidoException("QR code inválido.");
            }
        } catch (IllegalArgumentException e) {
            throw new AgendamentoInvalidoException("QR code inválido.");
        }

        String[] campos = dados.split("\\|");
        if (campos.length != 3) throw new AgendamentoInvalidoException("QR code inválido.");
        if (Instant.now().getEpochSecond() > Long.parseLong(campos[2])) {
            throw new AgendamentoInvalidoException("QR code vencido. Peça para o cliente mostrar o código de novo.");
        }
        return new DadosToken(UUID.fromString(campos[0]), UUID.fromString(campos[1]));
    }

    private byte[] assinar(String dados) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(dados.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao assinar o token de check-in", e);
        }
    }

    private static String base64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
