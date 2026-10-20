package com.rabisko.mvp.artist.domain;

import java.util.List;
import java.util.UUID;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;

public record ArtistProfileDTO(
        UUID tatuadorId,
        String nome,
        String fotoUrl,
        String bio,
        String instagram,
        String tier,
        UUID estudioId,
        String nomeEstudio,
        String fotoEstudioUrl,
        List<PortfolioImagemDTO> portfolio,
        String telefone,
        EnderecoDTO endereco,
        /** Dias abertos (1 = segunda ... 7 = domingo); vazio = horario nao informado. */
        List<HorarioDiaDTO> horarios
) {}

