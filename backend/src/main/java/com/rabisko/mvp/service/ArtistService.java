package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.artist.Artist;
import com.rabisko.mvp.domain.artist.ArtistDashboardDTO;
import com.rabisko.mvp.domain.artist.ArtistSearchProjection;
import com.rabisko.mvp.domain.artist.ArtistSearchResultDTO;
import com.rabisko.mvp.domain.artist.RegisterArtistaDTO;
import com.rabisko.mvp.domain.estilo.Estilo;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.domain.user.UserRole;
import com.rabisko.mvp.repositories.ArtistRepository;
import com.rabisko.mvp.repositories.ChatRepository;
import com.rabisko.mvp.repositories.EstiloRepository;

import jakarta.persistence.EntityNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

// =====================================================================
// SERVICE ArtistService — tres responsabilidades:
//
//   1) cadastrarArtista: cria a linha em `tatuadores` e amarra os
//      estilos escolhidos a M:N `tatuador_estilos`.
//
//   2) buscar: expoe a busca de tatuadores por estilo e/ou distancia,
//      empacotando os filtros pra @Query nativa do ArtistRepository.
//
//   3) dashboard: monta o DTO de metricas da home do tatuador logado
//      (chats abertos, etc.). Valida que o usuario e tatuador antes
//      de calcular.
//
// Nada de dados pessoais (nome/email/cpf) aqui — esses vivem em `users`.
// =====================================================================

@Service
public class ArtistService {

    private static final Logger log = LoggerFactory.getLogger(ArtistService.class);

    /** Raio padrao da busca por distancia quando o front nao passa um. */
    private static final double RAIO_KM_DEFAULT = 25.0;

    @Autowired private ArtistRepository artistRepository;
    @Autowired private EstiloRepository estiloRepository;
    @Autowired private ChatRepository chatRepository;

    /**
     * Cria o perfil tatuador apos o User ja ter sido salvo.
     * Os estilos vem como lista de nomes — a gente RESOLVE cada nome
     * pra um Estilo do catalogo via resolverEstilos().
     */
    public Artist cadastrarArtista(User user, RegisterArtistaDTO body) {
        Artist novoArtist = Artist.builder()
                .userId(user.getUserId())
                .bio(body.getBio())
                .instagram(body.getInstagram())
                .endereco(body.getEndereco())
                .vinculadoEstudio(false)                  // nasce autonomo
                .estilos(resolverEstilos(body.getEstilos()))
                .build();

        return artistRepository.save(novoArtist);
    }

    /**
     * Busca tatuadores com filtros OPCIONAIS:
     *   - estilos : se vier, restringe a tatuadores que fazem pelo menos 1 desses
     *   - lat/lng : se vier os DOIS, restringe a tatuadores dentro do raioKm
     *               (se faltar um, ignora distancia)
     *
     * Esse metodo aqui faz TODA a higiene de input (limpar strings vazias,
     * lowercase, defaults) antes de passar pro repositorio.
     */
    public List<ArtistSearchResultDTO> buscar(
            List<String> estilos,
            Double lat,
            Double lng,
            Double raioKm
    ) {
        // --- Filtro de estilos ---
        boolean semEstilo = estilos == null || estilos.isEmpty();
        List<String> estilosNormalizados = semEstilo
                ? Collections.emptyList()
                : estilos.stream()
                        .filter(s -> s != null && !s.isBlank())
                        .map(s -> s.trim().toLowerCase(Locale.ROOT))
                        .collect(Collectors.toList());

        // Se a limpeza zerou a lista (so vinha "  " ou null), desliga o filtro.
        if (estilosNormalizados.isEmpty()) {
            semEstilo = true;
        }

        // --- Filtro de distancia ---
        boolean semDistancia = lat == null || lng == null;
        double raio = (raioKm == null || raioKm <= 0) ? RAIO_KM_DEFAULT : raioKm;

        // Mesmo quando o filtro esta desligado (semEstilo/semDistancia = true)
        // o JDBC EXIGE valores nao-null pros binds. Mandamos sentinelas:
        Collection<String> estilosParam = estilosNormalizados.isEmpty()
                ? List.of("")
                : estilosNormalizados;
        double latParam = lat == null ? 0.0 : lat;
        double lngParam = lng == null ? 0.0 : lng;

        // Roda a SQL nativa e converte o resultado pra DTO de resposta.
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
     * Pega os nomes de estilos vindos no cadastro e devolve as entidades
     * Estilo correspondentes do catalogo. Comparacao case-insensitive.
     *
     * Se o front mandar um nome que NAO existe no catalogo (ex.: typo),
     * o estilo simplesmente nao entra — o cadastro nao falha. So loga
     * um warning pra a gente investigar depois.
     *
     * Por que nao deixar criar estilo novo na hora? Pra manter o
     * catalogo controlado (evita "Realismo", "realista", "Realismoo"...
     * cada tatuador inventando seu).
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

        // Se algum nome nao casou, loga quais nao encontramos.
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

    /**
     * Monta o DTO com as metricas da home do tatuador logado.
     *
     * Etapas:
     *   1) Bloqueia chamadas de outros papeis (cliente/estudio/admin) com 403.
     *   2) Resolve o perfil tatuador a partir do User logado.
     *   3) Consulta o ChatRepository pra contar chats ativos.
     *   4) Empacota tudo num ArtistDashboardDTO.
     *
     * Quando adicionar metricas novas no v2 (tempo medio de resposta,
     * novos chats nos ultimos 7 dias, etc.), e SO acrescentar campos no
     * DTO e calculos aqui — nem o controller nem o front precisam saber
     * detalhe nenhum.
     */
    public ArtistDashboardDTO dashboard(User logado) {
        if (logado.getRole() != UserRole.tatuador) {
            throw new AccessDeniedException("Apenas tatuadores podem acessar o dashboard");
        }

        Artist meuPerfil = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

        return new ArtistDashboardDTO(
                chatRepository.countByTatuadorIdAndAtivoTrue(meuPerfil.getTatuadorId())
        );
    }
}
