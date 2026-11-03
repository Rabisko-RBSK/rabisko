package com.rabisko.mvp.shared.infraestrutura.cnpj;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class ValidadorCnpjService {

    private static final long CNAE_TATUAGEM = 9609206;

    @Value("${rabisko.cnpj.api-url:https://brasilapi.com.br/api/cnpj/v1}")
    private String apiUrl;

    @Value("${rabisko.cnpj.timeout-ms:5000}")
    private int timeoutMs;

    @Value("${rabisko.cnpj.validacao.habilitada:true}")
    private boolean habilitada;

    public ResultadoCnpj consultar(String cnpj) {
        if (!habilitada) return ResultadoCnpj.conforme("ATIVA");

        String digitos = cnpj.replaceAll("\\D", "");
        try {
            Map<?, ?> r = RestClient.builder()
                    .requestFactory(fabricaComTimeout())
                    .build()
                    .get().uri(apiUrl + "/{cnpj}", digitos)
                    .retrieve().body(Map.class);
            String situacao = r == null ? null : (String) r.get("descricao_situacao_cadastral");
            if (!"ATIVA".equalsIgnoreCase(situacao)) {
                return ResultadoCnpj.naoConforme(situacao, "CNPJ com situação " + situacao + " na Receita Federal");
            }
            if (!temCnaeTatuagem(r)) {
                return ResultadoCnpj.naoConforme(situacao, "O CNPJ não tem a atividade de tatuagem (CNAE 9609-2/06)");
            }
            return ResultadoCnpj.conforme(situacao);
        } catch (HttpClientErrorException.NotFound e) {
            return ResultadoCnpj.naoConforme(null, "CNPJ não encontrado na Receita Federal");
        } catch (RestClientException e) {
            return ResultadoCnpj.indisponivel();
        }
    }

    private boolean temCnaeTatuagem(Map<?, ?> r) {
        if (codigo(r.get("cnae_fiscal")) == CNAE_TATUAGEM) return true;
        if (!(r.get("cnaes_secundarios") instanceof List<?> secundarios)) return false;
        return secundarios.stream()
                .filter(Map.class::isInstance)
                .anyMatch(c -> codigo(((Map<?, ?>) c).get("codigo")) == CNAE_TATUAGEM);
    }

    private static long codigo(Object valor) {
        if (valor instanceof Number n) return n.longValue();
        if (valor instanceof String s && !s.isBlank()) {
            String d = s.replaceAll("\\D", "");
            return d.isEmpty() ? -1 : Long.parseLong(d);
        }
        return -1;
    }

    private ClientHttpRequestFactory fabricaComTimeout() {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(timeoutMs);
        fabrica.setReadTimeout(timeoutMs);
        return fabrica;
    }

    public ResultadoCnpj exigirConforme(String cnpj) {
        ResultadoCnpj r = consultar(cnpj);
        if (r.status() == ResultadoCnpj.Status.NAO_CONFORME) {
            throw new IllegalArgumentException(r.motivo());
        }
        return r;
    }
}
