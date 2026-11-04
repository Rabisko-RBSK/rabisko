package com.rabisko.mvp.artist.service;

import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.artist.domain.*;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.artist.repository.PortfolioImagemRepository;
import com.rabisko.mvp.appointment.repository.AppointmentRepository;
import com.rabisko.mvp.chat.repository.ChatRepository;
import com.rabisko.mvp.endereco.domain.Endereco;
import com.rabisko.mvp.endereco.service.EnderecoService;
import com.rabisko.mvp.estilo.repository.EstiloRepository;
import com.rabisko.mvp.horario.domain.HorarioDTO;
import com.rabisko.mvp.horario.service.HorarioService;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ResultadoCnpj;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ValidadorCnpjService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.shared.storage.StorageService;
import com.rabisko.mvp.studio.domain.ContratoDTO;
import com.rabisko.mvp.studio.domain.ConviteDTO;
import com.rabisko.mvp.studio.domain.ConviteDetalheDTO;
import com.rabisko.mvp.studio.domain.ConviteEstudio;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.domain.StudioDTO;
import com.rabisko.mvp.studio.repository.ConviteEstudioRepository;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.studio.service.ContratoService;
import com.rabisko.mvp.studio.service.StudioService;

import jakarta.persistence.EntityNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.rabisko.mvp.studio.domain.ConviteStatus.*;


@Service
public class ArtistService {

    private static final Logger log = LoggerFactory.getLogger(ArtistService.class);

    /** Tamanho maximo da bio (espelha BIO_MAX da tela de perfil). */
    private static final int BIO_MAX = 300;

    @Autowired private ArtistRepository artistRepository;
    @Autowired private EstiloRepository estiloRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private PortfolioImagemRepository portfolioImagemRepository;
    @Autowired private StorageService storageService;
    @Autowired private ConviteEstudioRepository conviteEstudioRepository;
    @Autowired private StudioRepository studioRepository;
    @Autowired private ContratoService contratoService;
    @Autowired private EnderecoService enderecoService;
    @Autowired private HorarioService horarioService;
    @Autowired private StudioService studioService;
    @Autowired private ValidadorCnpjService validadorCnpj;

    /**
     * Cria o perfil tatuador apos o UsuarioLogado ja ter sido salvo.
     * Os estilos vem como lista de nomes — a gente RESOLVE cada nome
     * pra um Estilo do catalogo via resolverEstilos().
     */
    @Transactional
    public Artist cadastrarArtista(UUID authId, RegisterArtistaDTO body, ResultadoCnpj cnpj) {
        Artist novoArtist = Artist.builder()
                .authId(authId)
                .nome(body.getNome())
                .cpf(body.getCpf())
                .dataNasc(body.getDataNasc())
                .telefone(body.getTelefone())
                .termosAceitos(body.isTermosAceitos())
                .bio(body.getBio())
                .instagram(body.getInstagram())
                .build();

        Artist a = artistRepository.save(novoArtist);

        if (body.getEstudioSolo() != null) {
            studioService.criarEstudioSolo(a, body.getEstudioSolo(), cnpj);
        }

        return a;
    }

    /**
     * Tatuador abre o estúdio próprio depois do cadastro. Sem @Transactional:
     * a consulta à Receita fica fora da transação; criarEstudioSolo abre a sua.
     */
    public StudioDTO criarEstudioProprio(UsuarioLogado logado, EstudioSoloDTO body) {
        Artist artist = exigirArtistDoUser(logado);
        if (contratoService.estudioProprio(artist.getTatuadorId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já tem um estúdio próprio");
        }
        ResultadoCnpj cnpj;
        try {
            cnpj = validadorCnpj.exigirConforme(body.cnpj());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return StudioDTO.from(studioService.criarEstudioSolo(artist, body, cnpj));
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
        FiltroBusca f = FiltroBusca.de(estilos, lat, lng, raioKm);
        List<ArtistSearchProjection> rows = artistRepository.buscar(
                f.semEstilo(), f.estilos(), f.semDistancia(), f.lat(), f.lng(), f.raioKm());

        return rows.stream()
                .map(ArtistSearchResultDTO::fromProjection)
                .collect(Collectors.toList());
    }

    public List<HorarioDTO> horariosDoTatuador(UUID idTatuador){
        return contratoService.estudioDeAtendimento(idTatuador)
                .map(horarioService::listar)
                .orElse(List.of());
    }

    /**
     * Retorna o perfil do tatuador logado (nome, foto, bio, instagram
     * e portfolio). Usado pelo GET /artist/me.
     */
    public ArtistProfileDTO obterPerfil(UsuarioLogado user) {
        Artist artist = exigirArtistDoUser(user);
        List<PortfolioImagemDTO> portfolio = portfolioImagemRepository
                .listarPorTatuador(artist.getTatuadorId())
                .stream()
                .map(PortfolioImagemDTO::fromEntity)
                .collect(Collectors.toList());

        Studio estudio = contratoService.estudioDeAtendimento(artist.getTatuadorId())
        .flatMap(studioRepository::findById)
        .orElse(null);


        return new ArtistProfileDTO(
                artist.getTatuadorId(),
                artist.getNome(),
                artist.getFotoPerfilUrl(),
                artist.getBio(),
                artist.getInstagram(),
                null,
                estudio != null ? estudio.getEstudioId() : null,
                estudio != null ? estudio.getNome() : null,
                estudio != null ? estudio.getFotoPerfilUrl() : null,
                portfolio,
                artist.getTelefone(),
                enderecoService.buscar(estudio != null ? estudio.getEnderecoId() : null)
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
    @Transactional
    public ArtistProfileDTO atualizarPerfil(UsuarioLogado user, Map<String, Object> payload) {
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

        if(payload.containsKey("instagram")){
            Object raw = payload.get("instagram");
            if (raw == null) {
                artist.setInstagram(null);
            } else if (raw instanceof String s) {
                String t = s.trim();
                artist.setInstagram(t.isEmpty() ? null : t.replaceFirst("^@+", ""));
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "instagram deve ser string ou null");
            }
        }

        if(payload.containsKey("nome")){
            Object raw = payload.get("nome");
            if (raw == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nome não pode ser vazio");
            } else if (raw instanceof String s) {
                if(s.isBlank()){
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nome não pode ser vazio");
                }
                String t = s.trim();
                if (t.length() > 150) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nome não pode ter mais de 150 caracteres");
                artist.setNome(t);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nome deve ser string");
            }
        }

        if (payload.containsKey("telefone")) {
            Object raw = payload.get("telefone");
            if (raw == null || (raw instanceof String s0 && s0.isBlank())) {
                artist.setTelefone(null);
            } else if (raw instanceof String s) {
                String digitos = s.replaceAll("\\D", "");
                if (digitos.length() != 10 && digitos.length() != 11) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "telefone deve ter 10 ou 11 digitos");
                }
                artist.setTelefone(digitos);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "telefone deve ser string");
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
    public String uploadFotoPerfil(UsuarioLogado user, MultipartFile file) {
        exigirArtistDoUser(user);
        return storageService.uploadFotoPerfil(file);
    }


    public PortfolioImagemDTO adicionarImagemPortfolio(UsuarioLogado user, MultipartFile file, UUID estiloId) {
        Artist artist = exigirArtistDoUser(user);
        if (!estiloRepository.existsById(estiloId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estilo inválido");
        }
        String url = storageService.uploadPortfolio(file);


        Portfolio nova = Portfolio.builder()
                .tatuadorId(artist.getTatuadorId())
                .url(url)
                .estiloId(estiloId)
                .build();
        nova = portfolioImagemRepository.save(nova);
        return PortfolioImagemDTO.fromEntity(nova);
    }

    public void removerImagemPortfolio(UsuarioLogado user, UUID imagemId) {
        Artist artist = exigirArtistDoUser(user);
        Portfolio img = portfolioImagemRepository
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


    /** Resolve o Artist do UsuarioLogado logado; 404 se o user nao for um tatuador. */
    private Artist exigirArtistDoUser(UsuarioLogado user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sem usuario autenticado");
        }
        return artistRepository.findByAuthId(user.authId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario nao possui perfil de tatuador"
                ));
    }

    /**
     * Monta o DTO com as metricas da home do tatuador logado.
     *
     * Etapas:
     *   1) Bloqueia chamadas de outros papeis (cliente/estudio/admin) com 403.
     *   2) Resolve o perfil tatuador a partir do UsuarioLogado logado.
     *   3) Consulta o ChatRepository pra contar chats ativos.
     *   4) Empacota tudo num ArtistDashboardDTO.
     *
     * Quando adicionar metricas novas no v2 (tempo medio de resposta,
     * novos chats nos ultimos 7 dias, etc.), e SO acrescentar campos no
     * DTO e calculos aqui — nem o controller nem o front precisam saber
     * detalhe nenhum.
     */
    public ArtistDashboardDTO dashboard(UsuarioLogado logado) {
            if (!"tatuador".equals(logado.papel())) {
                    throw new AccessDeniedException("Apenas tatuadores podem acessar o dashboard");
            }

            Artist meuPerfil = artistRepository.findByAuthId(logado.authId())
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

            BigDecimal valorMedioServicoMes = totalAgendamentosMes == 0
                    ? null
                    : valorTotalMes.divide(BigDecimal.valueOf(totalAgendamentosMes), 2, RoundingMode.HALF_UP);

            return new ArtistDashboardDTO(chatsAbertos, valorTotalMes, totalAgendamentosMes, valorMedioServicoMes);
    }

    public List<ConviteDetalheDTO> encontrarConvitesPendentes(UsuarioLogado logado) {
        Artist artist = exigirArtistDoUser(logado);
        return contratoService.comContratos(
                conviteEstudioRepository.listarDetalhesDoTatuador(artist.getTatuadorId(), pendente));
    }

    @Transactional
    public ConviteDTO aceitarConvite(UsuarioLogado logado, UUID conviteId) {
        Artist artist = exigirArtistDoUser(logado);

        UUID tatuadorId = artist.getTatuadorId();

        ConviteEstudio convite = conviteEstudioRepository.findByConviteIdAndTatuadorId(conviteId, tatuadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Convite não encontrado"));

        if (contratoService.estudioColaborador(tatuadorId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você já é colaborador de um estúdio. Saia dele antes de aceitar outro convite.");
        }

        if(convite.getStatus() != pendente){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convite nao esta mais pendente");
        }

        LocalDateTime agora = LocalDateTime.now();
        convite.setStatus(aceito);
        convite.setDataResposta(agora);

        conviteEstudioRepository.cancelarOutrosPendentes(tatuadorId, conviteId, agora);
        contratoService.aceitarDoConvite(conviteId, tatuadorId, agora);

        return ConviteDTO.from(convite);
    }

    @Transactional
    public ConviteDTO recusarConvite(UsuarioLogado logado, UUID conviteId) {
        Artist artist = exigirArtistDoUser(logado);

        UUID tatuadorId = artist.getTatuadorId();

        ConviteEstudio convite = conviteEstudioRepository.findByConviteIdAndTatuadorId(conviteId, tatuadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Convite não encontrado"));

        if(convite.getStatus() != pendente){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Convite nao esta mais pendente");
        }

        LocalDateTime agora = LocalDateTime.now();
        convite.setStatus(recusado);
        convite.setDataResposta(agora);
        contratoService.recusarDoConvite(conviteId, agora);

        return ConviteDTO.from(convite);
    }

    @Transactional
    public void sairEstudio(UsuarioLogado logado) {
        Artist artist = exigirArtistDoUser(logado);

        UUID estudioId = contratoService.estudioColaborador(artist.getTatuadorId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                "Artista não é colaborador de nenhum estúdio"));
        
        contratoService.encerrarVinculo(estudioId, artist.getTatuadorId());
    }

    public List<ContratoDTO> meusContratos(UsuarioLogado logado) {
        Artist artist = exigirArtistDoUser(logado);
        return contratoService.historicoDoTatuador(artist.getTatuadorId());
    }

    public ContratoDTO recusarPropostaContrato(UsuarioLogado logado) {
        Artist artist = exigirArtistDoUser(logado);
        return ContratoDTO.from(contratoService.recusarRenegociacao(
            exigirEstudioColaborador(artist), artist.getTatuadorId()));
    }

    private UUID exigirEstudioColaborador(Artist artist) {
        return contratoService.estudioColaborador(artist.getTatuadorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Artista não é colaborador de nenhum estúdio"));
    }

    public ContratoDTO aceitarPropostaContrato(UsuarioLogado logado) {
        Artist artist = exigirArtistDoUser(logado);
        return ContratoDTO.from(contratoService.aceitarRenegociacao(
                exigirEstudioColaborador(artist), artist.getTatuadorId()));
    }
}
