package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.Studio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

// =====================================================================
// REPOSITORY StudioRepository — acesso a tabela `estudios`.
//
// Sem queries customizadas por enquanto: o CRUD herdado de JpaRepository
// (save, findById, findAll, deleteById, ...) ja resolve tudo que o MVP
// precisa pra estudios.
// =====================================================================
public interface StudioRepository extends JpaRepository<Studio, UUID> {
}
