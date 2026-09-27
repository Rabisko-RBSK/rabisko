package com.rabisko.mvp.studio.repository;

import java.util.UUID;
import com.rabisko.mvp.studio.domain.ConviteEstudio;
import com.rabisko.mvp.studio.domain.ConviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConviteEstudioRepository extends JpaRepository<ConviteEstudio, UUID> {
    List<ConviteEstudio> findByTatuadorIdAndStatus(UUID tatuadorId, ConviteStatus status);

    List<ConviteEstudio> findByEstudioIdAndStatus(UUID estudioId, ConviteStatus status);

    boolean existsByEstudioIdAndTatuadorIdAndStatus(UUID estudioId, UUID tatuadorId, ConviteStatus status);
}

