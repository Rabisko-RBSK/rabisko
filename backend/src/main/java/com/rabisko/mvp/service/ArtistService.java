package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.artist.Artist;
import com.rabisko.mvp.domain.artist.ArtistSearchProjection;
import com.rabisko.mvp.domain.artist.ArtistSearchResultDTO;
import com.rabisko.mvp.domain.artist.RegisterArtistaDTO;
import com.rabisko.mvp.domain.estilo.Estilo;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.repositories.ArtistRepository;
import com.rabisko.mvp.repositories.EstiloRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cria a linha em `tatuadores` que materializa o papel de artista do User
 * e expoe a busca por estilo/distancia.
 *
 * Notas:
 *  - Dados pessoais (nome/email/cpf/telefone/senha) NAO sao replicados
 *    aqui — vivem em `users` e sao consultados via JOIN ou
 *    UserRepository.findById(userId). Ver Artist.java.
 *  - termosAceitos vive em User.termosAceitos (UserService.construirUser
 *    ja gravou). Mantido fora desta linha pra evitar duplicacao.
 *  - estilos: lista de nomes vinda do DTO. Persistido na M:N
 *    `tatuador_estilos` via @ManyToMany no Artist. Nomes desconhecidos
 *    no catalogo sao logados como warning e ignorados (front nao
 *    consegue criar estilos novos — catalogo controlado).
 */
@Service
public class ArtistService {

    private static final Logger log = LoggerFactory.getLogger(ArtistService.class);

    /** Default usado quando o cliente manda lat/lng mas omite raioKm. */
    private static final double RAIO_KM_DEFAULT = 25.0;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private EstiloRepository estiloRepository;

    public Artist cadastrarArtista(User user, RegisterArtistaDTO body) {
        Artist novoArtist = Artist.builder()
                .userId(user.getUserId())
                .bio(body.getBio())
                .instagram(body.getInstagram())
                .endereco(body.getEndereco())
                .vinculadoEstudio(false)
                .estilos(resolverEstilos(body.getEstilos()))
                .build();

        return artistRepository.save(novoArtist);
    }

    /**
     * Busca tatuadores por estilo e/ou distancia. Ambos os filtros sao
     * opcionais — se nenhum vier, devolve todos os tatuadores ativos.
     *
     * Distancia exige lat E lng; raioKm cai pra {@link #RAIO_KM_DEFAULT} se
     * vier ausente/zero/negativo.
     */
    public List<ArtistSearchResultDTO> buscar(
            List<String> estilos,
            Double lat,
            Double lng,
            Double raioKm
    ) {
        boolean semEstilo = estilos == null || estilos.isEmpty();
        List<String> estilosNormalizados = semEstilo
                ? Collections.emptyList()
                : estilos.stream()
                        .filter(s -> s != null && !s.isBlank())
                        .map(s -> s.trim().toLowerCase(Locale.ROOT))
                        .collect(Collectors.toList());

        // Apos limpeza pode ter ficado vazio (so strings vazias) — degrada
        // pra "sem filtro" em vez de gerar query com IN ().
        if (estilosNormalizados.isEmpty()) {
            semEstilo = true;
        }

        boolean semDistancia = lat == null || lng == null;
        double raio = (raioKm == null || raioKm <= 0) ? RAIO_KM_DEFAULT : raioKm;

        // Sentinela: a query nativa nao toca nesses parametros quando o flag
        // correspondente e TRUE, mas o JDBC ainda precisa de algum valor pra
        // bindar — manda 0 pra evitar NPE no driver.
        Collection<String> estilosParam = estilosNormalizados.isEmpty()
                ? List.of("")
                : estilosNormalizados;
        double latParam = lat == null ? 0.0 : lat;
        double lngParam = lng == null ? 0.0 : lng;

        List<ArtistSearchProjection> rows = artistRepository.buscar(
                semEstilo,
                estilosParam,
                semDistancia,
                latParam,
                lngParam,
                raio
        );

        return rows.stream()
                .map(ArtistSearchResultDTO::fromProjection)
                .collect(Collectors.toList());
    }

    /**
     * Resolve nomes do DTO contra o catalogo de estilos. Casamento
     * case-insensitive; nomes que nao casam viram warning no log e nao
     * impedem o cadastro do tatuador.
     */
    private Set<Estilo> resolverEstilos(List<String> nomes) {
        if (nomes == null || nomes.isEmpty()) {
            return new HashSet<>();
        }
        List<String> limpos = nomes.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        if (limpos.isEmpty()) {
            return new HashSet<>();
        }
        List<Estilo> encontrados = estiloRepository.findByNomeInIgnoreCase(limpos);
        if (encontrados.size() != limpos.size()) {
            Set<String> encontradosNomes = encontrados.stream()
                    .map(e -> e.getNome().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());
            List<String> faltantes = limpos.stream()
                    .filter(s -> !encontradosNomes.contains(s.toLowerCase(Locale.ROOT)))
                    .collect(Collectors.toList());
            log.warn("Estilos nao encontrados no catalogo, ignorados: {}", faltantes);
        }
        return new HashSet<>(encontrados);
    }
}
