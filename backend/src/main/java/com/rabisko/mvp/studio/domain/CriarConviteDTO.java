package com.rabisko.mvp.studio.domain;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CriarConviteDTO(@NotNull UUID tatuadorId){}
