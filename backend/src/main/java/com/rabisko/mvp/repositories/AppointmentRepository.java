package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.appointment.Appointment;
import com.rabisko.mvp.domain.appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByChatId(UUID chatId);

    List<Appointment> findByTatuadorIdAndStatusNot(UUID tatuadorId, AppointmentStatus status);
}
