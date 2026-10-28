-- Apenas um agendamento por data, hora e minuto para a profissional do salão.
-- Se houver horários duplicados, a criação do índice falha sem alterar registros.
-- Revise os conflitos antes de executar novamente.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_horario
    ON public.procedimentos_previstos
    (date_trunc('minute', proc_prev_data_agendado_para))
    WHERE proc_prev_data_agendado_para IS NOT NULL;
DROP INDEX IF EXISTS public.ux_agendamento_cliente_horario;
COMMIT;
