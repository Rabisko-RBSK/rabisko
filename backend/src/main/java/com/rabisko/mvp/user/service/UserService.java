package com.rabisko.mvp.user.service;

import com.rabisko.mvp.artist.domain.RegisterArtistaDTO;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.artist.service.ArtistService;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.client.service.ClientService;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ResultadoCnpj;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ValidadorCnpjService;
import com.rabisko.mvp.shared.infraestrutura.security.SupabaseAuthAdmin;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.studio.service.ContratoService;
import com.rabisko.mvp.studio.service.StudioService;
import com.rabisko.mvp.user.domain.UserDTO;
import com.rabisko.mvp.user.domain.UserResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;


@Service
public class UserService {

    @Autowired private SupabaseAuthAdmin supabaseAuthAdmin;
    @Autowired private ClientService clientService;
    @Autowired private ArtistService artistService;
    @Autowired private StudioService studioService;
    @Autowired private ValidadorCnpjService validadorCnpj;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private StudioRepository studioRepository;
    @Autowired private ContratoService contratoService;


    public UUID cadastrarCliente(UserDTO body) {
        UUID authId = supabaseAuthAdmin.criarConta(body.getEmail(), body.getSenha(), "cliente");
        try {
            clientService.cadastrarCliente(authId, body);
            return authId;
        } catch (RuntimeException e) {
            supabaseAuthAdmin.excluirConta(authId);
            throw e;
        }
    }


    public UUID cadastrarArtista(RegisterArtistaDTO body) {
        ResultadoCnpj cnpj = body.getEstudioSolo() != null
            ? validadorCnpj.exigirConforme(body.getEstudioSolo().cnpj())
            : null;
        UUID authId = supabaseAuthAdmin.criarConta(body.getEmail(), body.getSenha(), "tatuador");
        
        try {
            artistService.cadastrarArtista(authId, body, cnpj);
            return authId;
        } catch (RuntimeException e) {
            supabaseAuthAdmin.excluirConta(authId);
            throw e;
        }
    }

    public UUID cadastrarEstudio(RegisterEstudioDTO body) {
        ResultadoCnpj cnpj = validadorCnpj.exigirConforme(body.getCnpj());
        UUID authId = supabaseAuthAdmin.criarConta(body.getEmail(), body.getSenha(), "estudio");
        
        try {
            studioService.cadastrarEstudio(authId, body, cnpj);
            return authId;
        } catch (RuntimeException e) {
            supabaseAuthAdmin.excluirConta(authId);
            throw e;
        }
    }

    public void excluirConta(UsuarioLogado logado) {
        supabaseAuthAdmin.excluirConta(logado.authId());
    }

    public UserResponseDTO me(UsuarioLogado logado) {
        if (logado.papel() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado");
        }
        
        return switch (logado.papel()) {
            case "cliente"  -> clientRepository.findByAuthId(logado.authId())
                                .map(c -> new UserResponseDTO(logado.authId(), c.getNome(), logado.email(), c.getTelefone(), c.getDataNasc(), "cliente", null))
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado"));
            case "tatuador" -> artistRepository.findByAuthId(logado.authId())
                                .map(c -> new UserResponseDTO(logado.authId(), c.getNome(), logado.email(), c.getTelefone(), c.getDataNasc(),
                            "tatuador", contratoService.estudioProprio(c.getTatuadorId()).orElse(null)))
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado"));
            case "estudio"  -> studioRepository.findByAuthId(logado.authId())
                                .map(c -> new UserResponseDTO(logado.authId(), c.getNome(), logado.email(), c.getTelefone(), null, "estudio", null))
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado"));
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado");
        };
    }

}
