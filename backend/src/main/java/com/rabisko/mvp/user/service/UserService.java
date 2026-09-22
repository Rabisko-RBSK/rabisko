package com.rabisko.mvp.user.service;

import com.rabisko.mvp.artist.domain.RegisterArtistaDTO;
import com.rabisko.mvp.artist.service.ArtistService;
import com.rabisko.mvp.client.service.ClientService;
import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.studio.service.StudioService;
import com.rabisko.mvp.user.domain.ExcludeDTO;
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.user.domain.UserDTO;
import com.rabisko.mvp.user.domain.UserRole;
import com.rabisko.mvp.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;


@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private ClientService clientService;
    @Autowired private ArtistService artistService;
    @Autowired private StudioService studioService;


    @Transactional
    public User cadastrarCliente(UserDTO body) {
        User novoUser = construirUser(
                body.getNome(),
                body.getEmail(),
                body.getSenha(),
                body.getTelefone(),
                body.getDataNasc(),
                body.getCpf(),
                UserRole.cliente,
                body.isTermosAceitos()
        );
        User salvo = userRepository.save(novoUser);
        clientService.cadastrarCliente(salvo);
        return salvo;
    }


    @Transactional
    public User cadastrarArtista(RegisterArtistaDTO body) {
        User novoUser = construirUser(
                body.getNome(),
                body.getEmail(),
                body.getSenha(),
                body.getTelefone(),
                body.getDataNasc(),
                body.getCpf(),
                UserRole.tatuador,
                body.isTermosAceitos()
        );
        User salvo = userRepository.save(novoUser);
        artistService.cadastrarArtista(salvo, body);
        return salvo;
    }


    @Transactional
    public User cadastrarEstudio(RegisterEstudioDTO body) {
        User novoUser = construirUser(
                body.getNome(),
                body.getEmail(),
                body.getSenha(),
                body.getTelefone(),
                null,
                null,
                UserRole.estudio,
                body.isTermosAceitos()
        );
        User salvo = userRepository.save(novoUser);
        studioService.cadastrarEstudio(salvo, body);
        return salvo;
    }


    @Transactional
    public Long excluirUser(ExcludeDTO body) {
        if (!userRepository.existsByEmail(body.email())) {
            throw new RuntimeException("E-mail nao cadastrado!");
        }
        return userRepository.deleteByEmail(body.email());
    }


    /**
     * Centraliza a montagem do User pra evitar copy-paste nos 3 metodos
     * publicos de cadastro. Aqui acontecem duas coisas importantes:
     *
     *   1) Checagem de email ja existente. Se ja existir, lanca excecao
     *      ANTES de gerar hash da senha (poupa CPU em ataque de spam).
     *
     *   2) HASH BCrypt da senha. O usuario manda em texto puro; aqui
     *      transformamos em hash irreversivel antes de salvar. NUNCA
     *      guardamos a senha em texto puro no banco.
     */
    private User construirUser(
            String nome,
            String email,
            String senhaPlain,
            String telefone,
            LocalDate dataNasc,
            String cpf,
            UserRole role,
            boolean termosAceitos
    ) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("E-mail ja cadastrado!");
        }
        String senhaHash = new BCryptPasswordEncoder().encode(senhaPlain);

        return User.builder()
                .nome(nome)
                .email(email)
                .senha(senhaHash)
                .telefone(telefone)
                .dataNasc(dataNasc)
                .cpf(cpf)
                .role(role)
                .status(true)
                .termosAceitos(termosAceitos)
                .build();
    }
}
