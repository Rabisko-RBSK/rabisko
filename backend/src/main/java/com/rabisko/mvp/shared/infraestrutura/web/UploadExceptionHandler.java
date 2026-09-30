package com.rabisko.mvp.shared.infraestrutura.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Uploads acima de spring.servlet.multipart.max-file-size são rejeitados antes de chegar
 * em qualquer controller, e por padrão o Spring responde 413 sem logar nada.
 * Este handler deixa o erro visível no log e devolve uma mensagem legível para o app.
 */
@RestControllerAdvice
public class UploadExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(UploadExceptionHandler.class);

    @Value("${spring.servlet.multipart.max-file-size:1MB}")
    private String maxFileSize;

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxUploadSize(MaxUploadSizeExceededException e, HttpServletRequest request) {
        log.warn("Upload rejeitado em {} {}: arquivo maior que o limite de {} ({} bytes enviados)",
                request.getMethod(), request.getRequestURI(), maxFileSize, request.getContentLengthLong());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body("Arquivo muito grande. O tamanho máximo permitido é " + maxFileSize + ".");
    }
}
