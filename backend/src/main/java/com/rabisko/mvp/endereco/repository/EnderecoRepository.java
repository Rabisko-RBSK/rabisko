package com.rabisko.mvp.endereco.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rabisko.mvp.endereco.domain.Endereco;

public interface EnderecoRepository extends JpaRepository<Endereco, UUID>{

}
