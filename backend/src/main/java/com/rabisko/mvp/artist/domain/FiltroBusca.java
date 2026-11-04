package com.rabisko.mvp.artist.domain;

import java.util.Collection;
import java.util.List;
import java.util.Locale;

/**
 * Parâmetros das buscas nativas de tatuadores e estúdios já normalizados.
 * Filtro desligado ainda precisa de valor: o Postgres não aceita IN () vazio
 * nem parâmetros null nos cálculos de distância, então vão placeholders
 * acompanhados das flags semEstilo/semDistancia.
 */
public record FiltroBusca(
        boolean semEstilo,
        Collection<String> estilos,
        boolean semDistancia,
        double lat,
        double lng,
        double raioKm
) {
    public static final double RAIO_KM_DEFAULT = 25.0;

    public static FiltroBusca de(List<String> estilos, Double lat, Double lng, Double raioKm) {
        List<String> normalizados = estilos == null ? List.of() : estilos.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim().toLowerCase(Locale.ROOT))
                .toList();

        boolean semEstilo = normalizados.isEmpty();
        boolean semDistancia = lat == null || lng == null;
        return new FiltroBusca(
                semEstilo,
                semEstilo ? List.of("") : normalizados,
                semDistancia,
                lat == null ? 0.0 : lat,
                lng == null ? 0.0 : lng,
                (raioKm == null || raioKm <= 0) ? RAIO_KM_DEFAULT : raioKm);
    }
}
