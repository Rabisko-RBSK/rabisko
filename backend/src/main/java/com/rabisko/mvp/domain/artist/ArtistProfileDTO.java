package com.rabisko.mvp.domain.artist;

import com.rabisko.mvp.domain.portfolio.PortfolioImagemDTO;

import java.util.List;
import java.util.UUID;

// =====================================================================
// DTO ArtistProfileDTO — resposta de GET /artist/me.
//
// Combina dados de 3 tabelas numa unica resposta pra a tela de perfil:
//   - users.nome                   (nome de exibicao)
//   - tatuadores.foto_perfil_url   (avatar; nullable)
//   - tatuadores.bio               (campo "Sobre"; nullable)
//   - tatuadores.instagram         (handle; nullable)
//   - portfolio_imagens.*          (galeria, ja ordenada)
//
// `tier` ainda nao existe no banco — devolvemos sempre null. O front
// esconde o selo quando vem null. Mantemos o campo no DTO pra nao quebrar
// o contrato quando o sistema de niveis chegar.
//
// Mantem em sync com a interface `ArtistProfile` do mobile
// (mobile/src/services/api/artistService.ts).
// =====================================================================
public record ArtistProfileDTO(
        UUID tatuadorId,
        String nome,
        String fotoUrl,
        String bio,
        String instagram,
        String tier,
        List<PortfolioImagemDTO> portfolio
) {}
