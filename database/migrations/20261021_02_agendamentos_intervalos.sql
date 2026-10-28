-- Etapa 2: preencher a duração de todos os procedimentos existentes antes de aplicar.
-- Captura a duração dos agendamentos antigos uma única vez, sem substituir reservas já definidas.
BEGIN;
LOCK TABLE public.procedimentos_previstos IN ACCESS EXCLUSIVE MODE;
UPDATE public.procedimentos_previstos a
SET proc_prev_duracao_minutos = p.proc_duracao_minutos
FROM public.procedimentos p
WHERE a.procedimentos_proc_id = p.proc_id
  AND a.proc_prev_duracao_minutos IS NULL
  AND p.proc_duracao_minutos > 0;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.procedimentos_previstos WHERE proc_prev_duracao_minutos IS NULL OR proc_prev_duracao_minutos <= 0) THEN
        RAISE EXCEPTION 'Preencha a duração dos procedimentos vinculados aos agendamentos antigos antes de continuar.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ex_agendamento_intervalo'
        AND conrelid = 'public.procedimentos_previstos'::regclass) THEN
        ALTER TABLE public.procedimentos_previstos ADD CONSTRAINT ex_agendamento_intervalo
        EXCLUDE USING gist (tsrange(proc_prev_data_agendado_para,
            proc_prev_data_agendado_para + proc_prev_duracao_minutos * interval '1 minute', '[)') WITH &&)
        WHERE (proc_prev_data_agendado_para IS NOT NULL);
    END IF;
END $$;

ALTER TABLE public.procedimentos_previstos ALTER COLUMN proc_prev_duracao_minutos SET NOT NULL;
DROP INDEX IF EXISTS public.ux_agendamento_horario;
DROP INDEX IF EXISTS public.ux_agendamento_cliente_horario;
COMMIT;
-- Conflitos existentes impedem a aplicação e mantêm todos os dados originais.
-- Revise os horários conflitantes e execute novamente. Nenhum registro é excluído.
