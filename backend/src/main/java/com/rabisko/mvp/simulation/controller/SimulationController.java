package com.rabisko.mvp.simulation.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rabisko.mvp.simulation.service.SimulationService;


@RestController
@RequestMapping("simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    /**
     * POST /simulation/removebg
     *
     * `consumes = MULTIPART_FORM_DATA` aceita upload de arquivo.
     * @RequestParam("image") pega o campo de arquivo chamado "image".
     * @RequestParam("mode") escolhe o algoritmo: "auto" (padrão, decide pela imagem),
     * "u2net" (IA para fundos complexos) ou "lineart" (por brilho, para desenhos em papel branco).
     */
    @PostMapping(value = "/removebg", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> removeBg(@RequestParam("image") MultipartFile image,
                                      @RequestParam(value = "mode", defaultValue = "auto") String mode) {
        SimulationService.RemovalMode removalMode;
        try {
            removalMode = SimulationService.RemovalMode.from(mode);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        try {
            System.out.println("===> [SIMULADOR] Recebendo imagem de tamanho: " + (image.getSize() / 1024) + " KB (modo " + removalMode + ")");
            long startTime = System.currentTimeMillis();

            byte[] processedImage = simulationService.removeBackground(image, removalMode);

            long endTime = System.currentTimeMillis();
            System.out.println("===> [SIMULADOR] Imagem processada com sucesso em " + (endTime - startTime) + "ms");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);

            return new ResponseEntity<>(processedImage, headers, HttpStatus.OK);
        } catch (SimulationService.UnsupportedImageFormatException e) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(e.getMessage());
        } catch (Exception e) {
            System.err.println("===> [SIMULADOR] Erro ao processar: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao processar imagem: " + e.getMessage());
        }
    }
}
