package com.rabisko.mvp.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rabisko.mvp.service.SimulationService;

// =====================================================================
// CONTROLLER SimulationController — recebe imagens da SIMULACAO.
//
// Endpoint:
//   POST /simulation/removebg (multipart/form-data com campo "image")
//
// Esse endpoint e PUBLICO (sem JWT) — liberado em SecurityConfiguration
// via .requestMatchers("/simulation/**").permitAll(). Decisao: e uma
// feature exploratoria, sem dados sensiveis.
//
// O que ele faz:
//   1) Recebe um arquivo de imagem via multipart
//   2) Delega ao SimulationService.removeBackground (que usa BoofCV)
//   3) Devolve um PNG transparente com o traco preto da tattoo isolado
//
// Diferenca do construtor com @Autowired:
//   Aqui injetamos via CONSTRUTOR (em vez de @Autowired no campo). E o
//   estilo preferido em Spring moderno — mais seguro pra testes
//   (consegue instanciar a classe sem o container do Spring).
// =====================================================================

@RestController
@RequestMapping("simulation")
public class SimulationController {

    private final SimulationService simulationService;

    // Injecao por construtor — Spring chama esse construtor passando o bean automaticamente.
    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    /**
     * POST /simulation/removebg
     *
     * `consumes = MULTIPART_FORM_DATA` aceita upload de arquivo.
     * @RequestParam("image") pega o campo de arquivo chamado "image".
     */
    @PostMapping(value = "/removebg", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> removeBg(@RequestParam("image") MultipartFile image) {
        try {
            System.out.println("===> [SIMULADOR] Recebendo imagem de tamanho: " + (image.getSize() / 1024) + " KB");
            long startTime = System.currentTimeMillis();

            byte[] processedImage = simulationService.removeBackground(image);

            long endTime = System.currentTimeMillis();
            System.out.println("===> [SIMULADOR] Imagem processada com sucesso em " + (endTime - startTime) + "ms");

            // Configura a resposta como PNG (Content-Type: image/png)
            // pra que o navegador/app entenda que o body e uma imagem.
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);

            return new ResponseEntity<>(processedImage, headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("===> [SIMULADOR] Erro ao processar: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao processar imagem: " + e.getMessage());
        }
    }
}
