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

// =====================================================================
// SERVICE UserService — orquestra os fluxos de cadastro e exclusao.
//
// O que e a CAMADA DE SERVICO?
//   Controllers cuidam de HTTP (rota, status, body). Repositorios
//   cuidam do banco. Entre eles, a CAMADA DE SERVICO carrega a
//   LOGICA DE NEGOCIO — validacoes, transformacoes, orquestracao
//   de varios repositorios em uma operacao so.
//
// Aqui especificamente:
//   - Cada papel tem 1 metodo publico de cadastro
//   - Cada um cria 2 linhas no banco: User + a entidade do papel
//     (Client, Artist ou Studio), via service do respectivo aggregate
//   - excluirUser remove a conta por email
//
// @Transactional — POR QUE?
//   Cadastro envolve 2 INSERTs (User + Client/Artist/Studio). Se o
//   segundo falhar, queremos que o primeiro tambem seja DESFEITO,
//   senao ficaria um User "orfao" no banco (com email UNIQUE travado).
//   @Transactional garante que tudo aconteca em uma so transacao:
//   ou tudo commita, ou tudo da rollback.
//   Tambem e necessario pra deleteByEmail (regra do Spring Data).
// =====================================================================

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private ClientService clientService;
    @Autowired private ArtistService artistService;
    @Autowired private StudioService studioService;

    // -------------------- CADASTRO CLIENTE --------------------

    @Transactional
    public User cadastrarCliente(UserDTO body) {
        User novoUser = construirUser(
                body.getNome(),
                body.getEmail(),
                body.getSenha(),
                body.getTelefone(),
                body.getDataNasc(),
                body.getCpf(),
                UserRole.cliente,                  // role HARDCODED — nunca vem do payload
                body.isTermosAceitos()
        );
        User salvo = userRepository.save(novoUser);
        clientService.cadastrarCliente(salvo);     // cria linha em `clientes` apontando pro User
        return salvo;
    }

    // -------------------- CADASTRO ARTISTA --------------------

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
        artistService.cadastrarArtista(salvo, body);   // cria linha em `tatuadores` + vincula estilos
        return salvo;
    }

    // -------------------- CADASTRO ESTUDIO --------------------

    @Transactional
    public User cadastrarEstudio(RegisterEstudioDTO body) {
        // Estudio e pessoa juridica: nao tem dataNasc nem cpf.
        // O nome no User e o nome do estudio (no cadastro inicial sao iguais).
        User novoUser = construirUser(
                body.getNome(),
                body.getEmail(),
                body.getSenha(),
                body.getTelefone(),
                null,                  // dataNasc
                null,                  // cpf
                UserRole.estudio,
                body.isTermosAceitos()
        );
        User salvo = userRepository.save(novoUser);
        studioService.cadastrarEstudio(salvo, body);   // cria linha em `estudios`
        return salvo;
    }

    // -------------------- EXCLUSAO --------------------

    @Transactional
    public Long excluirUser(ExcludeDTO body) {
        if (!userRepository.existsByEmail(body.email())) {
            throw new RuntimeException("E-mail nao cadastrado!");
        }
        return userRepository.deleteByEmail(body.email());
    }

    // ==================================================================
    // HELPER PRIVADO
    // ==================================================================

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
                .senha(senhaHash)         // SEMPRE o hash, nunca a senha plain
                .telefone(telefone)
                .dataNasc(dataNasc)
                .cpf(cpf)
                .role(role)
                .status(true)             // nasce ativo
                .termosAceitos(termosAceitos)
                .build();
    }
}
