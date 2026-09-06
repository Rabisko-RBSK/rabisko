ALTER TABLE public.enderecos
DROP COLUMN IF EXISTS geo_point;

DROP TRIGGER IF EXISTS trg_enderecos_geo ON public.enderecos;

DROP EXTENSION IF EXISTS postgis;