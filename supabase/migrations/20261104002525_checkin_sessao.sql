alter table public.reservas
    add column checkin_em     timestamptz,
    add column checkin_origem varchar(10)
        constraint chk_reservas_checkin_origem check (checkin_origem in ('qrcode', 'manual'));
