package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.Studio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StudioRepository extends JpaRepository<Studio, UUID> {
}
