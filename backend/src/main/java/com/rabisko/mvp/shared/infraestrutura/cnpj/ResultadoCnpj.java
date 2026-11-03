package com.rabisko.mvp.shared.infraestrutura.cnpj;

public record ResultadoCnpj(Status status, String situacao, String motivo) {

    public enum Status { CONFORME, NAO_CONFORME, INDISPONIVEL }

    public static ResultadoCnpj conforme(String situacao) {
        return new ResultadoCnpj(Status.CONFORME, situacao, null);
    }

    public static ResultadoCnpj naoConforme(String situacao, String motivo) {
        return new ResultadoCnpj(Status.NAO_CONFORME, situacao, motivo);
    }

    public static ResultadoCnpj indisponivel() {
        return new ResultadoCnpj(Status.INDISPONIVEL, null, null);
    }
}




