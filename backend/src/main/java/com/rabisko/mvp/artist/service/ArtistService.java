package com.rabisko.mvp.artist.service;

import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistDashboardDTO;
import com.rabisko.mvp.artist.domain.ArtistProfileDTO;
import com.rabisko.mvp.artist.domain.ArtistSearchProjection;
import com.rabisko.mvp.artist.domain.ArtistSearchResultDTO;
import com.rabisko.mvp.artist.domain.AvaliacaoDTO;
import com.rabisko.mvp.artist.domain.PortfolioImagem;
import com.rabisko.mvp.artist.domain.PortfolioImagemDTO;
import com.rabisko.mvp.artist.domain.RegisterArtistaDTO;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.artist.repository.PortfolioImagemRepository;
import com.rabisko.mvp.appointment.repository.AppointmentRepository;
import com.rabisko.mvp.chat.repository.ChatRepository;
import com.rabisko.mvp.estilo.domain.Estilo;
import com.rabisko.mvp.estilo.repository.EstiloRepository;
import com.rabisko.mvp.shared.storage.StorageService;
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.user.domain.UserRole;

import jakarta.persistence.EntityNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
public class ArtistService {

    private static final Logger log = LoggerFactory.getLogger(ArtistService.class);

    /** Raio padrao da busca por distancia quando o front nao passa um. */
    private static final double RAIO_KM_DEFAULT = 25.0;

    /** Tamanho maximo da bio (espelha BIO_MAX da tela de perfil). */
    private static final int BIO_MAX = 300;

    @Autowired private ArtistRepository artistRepository;
    @Autowired private EstiloRepository estiloRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private PortfolioImagemRepository portfolioImagemRepository;
    @Autowired private StorageService storageService;

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
                .vinculadoEstudio(false)
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
        boolean semEstilo = estilos == null || estilos.isEmpty();
        List<String> estilosNormalizados = semEstilo
                ? Collections.emptyList()
                : estilos.stream()
                        .filter(s -> s != null && !s.isBlank())
                        .map(s -> s.trim().toLowerCase(Locale.ROOT))
                        .collect(Collectors.toList());

        if (estilosNormalizados.isEmpty()) {
            semEstilo = true;
        }

        boolean semDistancia = lat == null || lng == null;
        double raio = (raioKm == null || raioKm <= 0) ? RAIO_KM_DEFAULT : raioKm;

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
     * Retorna o perfil do tatuador logado (nome do User, foto, bio, instagram
     * e portfolio). Usado pelo GET /artist/me.
     */
    public ArtistProfileDTO obterPerfil(User user) {
        Artist artist = exigirArtistDoUser(user);
        List<PortfolioImagemDTO> portfolio = portfolioImagemRepository
                .listarPorTatuador(artist.getTatuadorId())
                .stream()
                .map(PortfolioImagemDTO::fromEntity)
                .collect(Collectors.toList());

        return new ArtistProfileDTO(
                artist.getTatuadorId(),
                user.getNome(),
                artist.getFotoPerfilUrl(),
                artist.getBio(),
                artist.getInstagram(),
                null,
                portfolio
        );
    }

    /**
     * Atualiza campos do perfil. Semantica PATCH: apenas as chaves PRESENTES
     * no body sao alteradas — chave ausente significa "nao mexer". Por isso
     * recebemos Map em vez de DTO (Jackson nao distingue ausencia de null
     * em record/POJO).
     *
     * Chaves aceitas: `bio` (String|null) e `fotoUrl` (String|null).
     */
    public ArtistProfileDTO atualizarPerfil(User user, Map<String, Object> payload) {
        Artist artist = exigirArtistDoUser(user);
        if (payload == null) payload = Collections.emptyMap();

        if (payload.containsKey("bio")) {
            Object raw = payload.get("bio");
            if (raw == null) {
                artist.setBio(null);
            } else if (raw instanceof String s) {
                String t = s.trim();
                if (t.length() > BIO_MAX) t = t.substring(0, BIO_MAX);
                artist.setBio(t.isEmpty() ? null : t);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bio deve ser string ou null");
            }
        }

        if (payload.containsKey("fotoUrl")) {
            Object raw = payload.get("fotoUrl");
            if (raw == null) {
                artist.setFotoPerfilUrl(null);
            } else if (raw instanceof String s) {
                String t = s.trim();
                artist.setFotoPerfilUrl(t.isEmpty() ? null : t);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fotoUrl deve ser string ou null");
            }
        }

        artistRepository.save(artist);
        return obterPerfil(user);
    }

    /**
     * Recebe a imagem de perfil, sobe no bucket `profile_images` do Supabase
     * e devolve a URL publica. NAO grava no Artist — o front faz isso a
     * seguir via PATCH /artist/me com a URL retornada (assim a UI pode
     * mostrar a foto local enquanto decide se vai persistir).
     */
    public String uploadFotoPerfil(User user, MultipartFile file) {
        exigirArtistDoUser(user);
        return storageService.uploadFotoPerfil(file);
    }


    public PortfolioImagemDTO adicionarImagemPortfolio(User user, MultipartFile file, String descricao) {
        Artist artist = exigirArtistDoUser(user);
        String url = storageService.uploadPortfolio(file);

        PortfolioImagem nova = PortfolioImagem.builder()
                .tatuadorId(artist.getTatuadorId())
                .url(url)
                .descricao((descricao == null || descricao.isBlank()) ? null : descricao.trim())
                .build();
        nova = portfolioImagemRepository.save(nova);
        return PortfolioImagemDTO.fromEntity(nova);
    }

    public void removerImagemPortfolio(User user, UUID imagemId) {
        Artist artist = exigirArtistDoUser(user);
        PortfolioImagem img = portfolioImagemRepository
                .findByImagemIdAndTatuadorId(imagemId, artist.getTatuadorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagem nao encontrada"));

        portfolioImagemRepository.delete(img);
        storageService.deletePortfolio(img.getUrl());
    }


    /**
     * Lista avaliacoes recebidas por um tatuador. STUB: enquanto a tabela
     * `avaliacoes` nao for criada no Supabase, devolvemos lista vazia — a
     * UI mostra "Sem avaliacoes ainda" sem quebrar.
     */
    public List<AvaliacaoDTO> listarAvaliacoes(UUID tatuadorId) {
        return Collections.emptyList();
    }


    /** Resolve o Artist do User logado; 404 se o user nao for um tatuador. */
    private Artist exigirArtistDoUser(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sem usuario autenticado");
        }
        return artistRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario nao possui perfil de tatuador"
                ));
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

                UUID tatuadorId = meuPerfil.getTatuadorId();

                LocalDateTime inicioMes      = YearMonth.now().atDay(1).atStartOfDay();
                LocalDateTime inicioProxMes  = YearMonth.now().plusMonths(1).atDay(1).atStartOfDay();

                long chatsAbertos = chatRepository.countByTatuadorIdAndAtivoTrue(tatuadorId);

                BigDecimal valorTotalMes = appointmentRepository.somarValorTotalNoPeriodo(
                        tatuadorId, inicioMes, inicioProxMes);

                long totalAgendamentosMes = appointmentRepository
                        .countByTatuadorIdAndStatusNotInAndDataCriacaoBetween(
                                tatuadorId,
                                List.of(AppointmentStatus.cancelada, AppointmentStatus.no_show),
                                inicioMes,
                                inicioProxMes);

                return new ArtistDashboardDTO(chatsAbertos, valorTotalMes, totalAgendamentosMes);
        }
}
