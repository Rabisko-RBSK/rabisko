package com.rabisko.mvp.horario.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.rabisko.mvp.horario.domain.HorarioAtendimento;
import com.rabisko.mvp.horario.domain.HorarioDTO;
import com.rabisko.mvp.horario.repository.HorarioRepository;

import jakarta.transaction.Transactional;

@Service
public class HorarioService {
    @Autowired private HorarioRepository horarioRepository;

    public List<HorarioDTO> listar(UUID tatuadorId){
        List<HorarioAtendimento> listaHorarios = horarioRepository.findByTatuadorIdOrderByDiaSemanaAscAbreAsc(tatuadorId);
        List<HorarioDTO> listaHorarioDTO = new ArrayList<>();

        for(HorarioAtendimento h : listaHorarios){
            listaHorarioDTO.add(HorarioDTO.from(h));
        }

        return listaHorarioDTO;
    }

    @Transactional
    public void substituir(UUID tatuadorId, List<HorarioDTO> listaHorarios) {

        List<HorarioDTO> ordenada = listaHorarios.stream()
                .sorted(Comparator.comparingInt(HorarioDTO::diaSemana)
                        .thenComparing(HorarioDTO::abre))
                .toList();

        for (int i = 1; i < ordenada.size(); i++) {
            HorarioDTO anterior = ordenada.get(i - 1);
            HorarioDTO atual = ordenada.get(i);

            boolean mesmoDia = atual.diaSemana() == anterior.diaSemana();
            boolean cruza = atual.abre().isBefore(anterior.fecha());

            if (mesmoDia && cruza) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Há horários sobrepostos no mesmo dia");
            }
        }

        horarioRepository.deleteByTatuadorId(tatuadorId);

        for (HorarioDTO h : ordenada) {
            horarioRepository.save(HorarioAtendimento.builder()
                    .tatuadorId(tatuadorId)
                    .diaSemana((short) h.diaSemana())
                    .abre(h.abre())
                    .fecha(h.fecha())
                    .build());
        }
    }


    public boolean atende(UUID tatuadorId, LocalDateTime inicio, int duracaoMinutos){
        List<HorarioDTO> listaHorarios = listar(tatuadorId);

        if(listaHorarios.size() == 0){
            return true;
        }else{
            int dia = inicio.getDayOfWeek().getValue();
            LocalTime inicioHora = inicio.toLocalTime();
            LocalTime fimHora = inicioHora.plusMinutes(duracaoMinutos);

            if (fimHora.isBefore(inicioHora)){
                return false;
            }

            for(HorarioDTO h : listaHorarios){
                if(h.diaSemana() == dia){
                    if(!inicioHora.isBefore(h.abre()) && !fimHora.isAfter(h.fecha())){
                        return true;
                    }
                }
            }
            return false;
        }
    }
}
