package com.rabisko.mvp.endereco.domain;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record EnderecoDTO(
        @NotBlank @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve ter 8 dígitos (00000-000)")
        String cep,

        @NotBlank @Size(max = 200)
        String logradouro,

        @Size(max = 20)
        String numero,

        @Size(max = 100)
        String complemento,

        @Size(max = 100)
        String bairro,

        @NotBlank @Size(max = 100)
        String cidade,

        @NotBlank @Size(min = 2, max = 2)
        String uf,

        @DecimalMin("-90") @DecimalMax("90")
        BigDecimal latitude,

        @DecimalMin("-180") @DecimalMax("180")
        BigDecimal longitude
) {
    @JsonIgnore
    @AssertTrue(message = "Informe latitude e longitude juntas, ou nenhuma das duas")
    public boolean isCoordenadasCompletas() {
        return (latitude == null) == (longitude == null);
    }

    public Endereco toEntity(UUID ownerId, EnderecoOwnerType ownerType) {
        Endereco endereco = Endereco.builder()
                .ownerId(ownerId)
                .ownerType(ownerType)
                .build();
        aplicarEm(endereco);
        return endereco;
    }

    public void aplicarEm(Endereco endereco) {
        endereco.setCep(normalizarCep(cep));
        endereco.setLogradouro(logradouro.trim());
        endereco.setNumero(vazioParaNulo(numero));
        endereco.setComplemento(vazioParaNulo(complemento));
        endereco.setBairro(vazioParaNulo(bairro));
        endereco.setCidade(cidade.trim());
        endereco.setUf(uf.trim().toUpperCase());
        endereco.setLatitude(latitude);
        endereco.setLongitude(longitude);
    }

    public static EnderecoDTO from(Endereco e) {
        if (e == null) return null;
        return new EnderecoDTO(
                e.getCep(), e.getLogradouro(), e.getNumero(), e.getComplemento(), e.getBairro(),
                e.getCidade(), e.getUf(), e.getLatitude(), e.getLongitude()
        );
    }

    private static String normalizarCep(String cep) {
        String digitos = cep.replaceAll("\\D", "");
        return digitos.substring(0, 5) + "-" + digitos.substring(5);
    }

    private static String vazioParaNulo(String valor) {
        if (valor == null) return null;
        String t = valor.trim();
        return t.isEmpty() ? null : t;
    }
}
