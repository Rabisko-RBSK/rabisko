package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.shared.infraestrutura.cnpj.ResultadoCnpj;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ValidadorCnpjService;
import com.rabisko.mvp.studio.domain.CnpjStatus;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.repository.StudioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Confere de novo o CNPJ dos estúdios na Receita Federal, todo dia de
 * madrugada: pendentes (API estava fora do ar) e irregulares todo dia,
 * verificados a cada 30 dias.
 */
@Component
public class VerificacaoCnpjJob {

    private static final Logger log = LoggerFactory.getLogger(VerificacaoCnpjJob.class);
    private static final int DIAS_ENTRE_VERIFICACOES = 30;
    
    private static final long PAUSA_MS = 1500;

    @Autowired private StudioRepository studioRepository;
    @Autowired private ValidadorCnpjService validadorCnpj;

    @Scheduled(cron = "${rabisko.cnpj.reverificacao.cron:0 0 3 * * *}", zone = "America/Sao_Paulo")
    public void reverificar() {
        List<Studio> estudios = studioRepository.paraReverificarCnpj(
                List.of(CnpjStatus.pendente, CnpjStatus.irregular),
                LocalDateTime.now().minusDays(DIAS_ENTRE_VERIFICACOES));

        int alterados = 0;
        for (Studio estudio : estudios) {
            CnpjStatus antes = estudio.getCnpjStatus();
            ResultadoCnpj resultado = validadorCnpj.consultar(estudio.getCnpj());
            estudio.aplicarVerificacaoCnpj(resultado);
            
            studioRepository.save(estudio);
            if (estudio.getCnpjStatus() != antes) {
                alterados++;
                log.info("[CNPJ] {} ({}): {} -> {}", estudio.getNome(), estudio.getEstudioId(),
                        antes, estudio.getCnpjStatus());
            }
            pausar();
        }
        log.info("[CNPJ] reverificação: {} estúdio(s) consultado(s), {} mudaram de status",
                estudios.size(), alterados);
    }

    private void pausar() {
        try {
            Thread.sleep(PAUSA_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
