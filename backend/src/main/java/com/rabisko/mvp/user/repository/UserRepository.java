package com.rabisko.mvp.user.repository;

import com.rabisko.mvp.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

// =====================================================================
// REPOSITORY UserRepository — acesso a tabela `users`.
//
// O que e um Repository no Spring Data JPA?
//   E uma INTERFACE que voce extende de JpaRepository<Entity, ID>. Voce
//   nao escreve a implementacao — o Spring Data gera ela em tempo de
//   execucao. So por extender, voce ja ganha:
//     - save(entity)        : INSERT ou UPDATE
//     - findById(id)        : SELECT por chave primaria
//     - findAll()           : SELECT *
//     - deleteById(id)      : DELETE
//     - existsById(id)      : boolean
//   E mais um monte.
//
// "Derived queries" (queries derivadas do nome do metodo):
//   O Spring Data lê o nome do metodo e gera a SQL automaticamente.
//   Ex.: `existsByEmail(String email)` vira
//        `SELECT count(*) > 0 FROM users WHERE email = ?`
//   Ex.: `findByNomeAndStatusTrue` vira
//        `SELECT * FROM users WHERE nome = ? AND status = true`
// =====================================================================
public interface UserRepository extends JpaRepository<User, UUID> {

    /** Checa se ja existe usuario com esse email — usado pra evitar email duplicado no cadastro. */
    boolean existsByEmail(String email);

    /**
     * Busca por email. Retorna UserDetails (interface do Spring Security)
     * em vez de User direto pra que o AuthorizationService possa devolver
     * o resultado sem precisar de cast — User implementa UserDetails.
     */
    UserDetails findByEmail(String email);

    /**
     * DELETE WHERE email = ?
     *
     * Por que precisa de @Modifying e @Transactional?
     *   @Modifying  : avisa ao Spring Data que e UPDATE/DELETE (nao SELECT).
     *   @Transactional : DELETE precisa rodar dentro de transacao. Sem isso,
     *                    o Spring lanca erro em runtime.
     */
    @Modifying
    @Transactional
    Long deleteByEmail(String email);
}
