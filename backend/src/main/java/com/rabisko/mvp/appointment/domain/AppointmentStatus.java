package com.rabisko.mvp.appointment.domain;

// Valores em minúsculo para bater com o enum nativo `reserva_status` no Postgres.
// Segue o mesmo padrão de UserRole (admin/cliente/tatuador/estudio).
public enum AppointmentStatus {
    agendada,
    confirmada,      // estado inicial ao criar via chat
    em_andamento,
    concluida,
    cancelada,
    no_show
}
