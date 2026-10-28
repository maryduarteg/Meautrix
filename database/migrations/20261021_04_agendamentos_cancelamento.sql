-- Altera somente a estrutura. Não padroniza nem atualiza os registros existentes.
BEGIN;
ALTER TABLE public.procedimentos_previstos
    ADD COLUMN IF NOT EXISTS proc_prev_cancelado character(1) DEFAULT 'N';
ALTER TABLE public.procedimentos_previstos ALTER COLUMN proc_prev_cancelado SET DEFAULT 'N';
ALTER TABLE public.procedimentos_previstos
    ADD COLUMN IF NOT EXISTS usuarios_usu_cancelou_id integer REFERENCES public.usuarios(usu_id);
ALTER TABLE public.procedimentos_previstos ALTER COLUMN usuarios_usu_cancelou_id DROP NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_agendamento_cancelado'
        AND conrelid = 'public.procedimentos_previstos'::regclass) THEN
        ALTER TABLE public.procedimentos_previstos ADD CONSTRAINT ck_agendamento_cancelado
            CHECK (proc_prev_cancelado IS NOT NULL AND proc_prev_cancelado IN ('S', 'N')) NOT VALID;
    END IF;
END $$;
ALTER TABLE public.procedimentos_previstos DROP CONSTRAINT IF EXISTS ex_agendamento_intervalo;
ALTER TABLE public.procedimentos_previstos ADD CONSTRAINT ex_agendamento_intervalo
    EXCLUDE USING gist (tsrange(proc_prev_data_agendado_para,
        proc_prev_data_agendado_para + proc_prev_duracao_minutos * interval '1 minute', '[)') WITH &&)
    WHERE (proc_prev_data_agendado_para IS NOT NULL AND proc_prev_cancelado IS DISTINCT FROM 'S');
DROP INDEX IF EXISTS public.ux_agendamento_horario;
DROP INDEX IF EXISTS public.ux_agendamento_cliente_horario;
COMMIT;
-- Após a padronização da base: ALTER TABLE public.procedimentos_previstos VALIDATE CONSTRAINT ck_agendamento_cancelado;
