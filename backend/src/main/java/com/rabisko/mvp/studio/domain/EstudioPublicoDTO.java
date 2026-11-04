package com.rabisko.mvp.studio.domain;

import com.rabisko.mvp.endereco.domain.EnderecoDTO;
import com.rabisko.mvp.horario.domain.HorarioDTO;

import java.util.List;
import java.util.UUID;

/**
 * Perfil do estúdio visto pelo cliente. `donoTatuadorId` é o tatuador com
 * contrato "dono" ativo: "Conversar com o estúdio" abre o chat com ele.
 * Null quando o estúdio é uma conta própria sem tatuador dono.
 */
public record EstudioPublicoDTO(
        UUID estudioId,
        String nome,
        String telefone,
        String fotoPerfilUrl,
        EnderecoDTO endereco,
        List<HorarioDTO> horarios,
        List<ColaboradorDTO> equipe,
        UUID donoTatuadorId
) {}
