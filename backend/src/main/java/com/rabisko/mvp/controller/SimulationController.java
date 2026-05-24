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

@RestController
@RequestMapping("simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping(value = "/removebg", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> removeBg(@RequestParam("image") MultipartFile image) {
        try {
            System.out.println("===> [SIMULADOR] Recebendo imagem de tamanho: " + (image.getSize() / 1024) + " KB");
            long startTime = System.currentTimeMillis();

            // Repassa para o Service processar (BoofCV)
            byte[] processedImage = simulationService.removeBackground(image);
            
            long endTime = System.currentTimeMillis();
            System.out.println("===> [SIMULADOR] Imagem processada com sucesso em " + (endTime - startTime) + "ms");

            // Configura os headers para retornar a imagem como um PNG
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
