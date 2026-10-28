-- Executar antes de utilizar a validação de horários concorrentes.
-- Se houver duplicações antigas, o PostgreSQL interrompe a criação do índice;
-- revise esses agendamentos antes de executar novamente. Nenhum registro é excluído.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_cliente_horario
    ON public.procedimentos_previstos
    (cli_id, date_trunc('minute', proc_prev_data_agendado_para))
    WHERE cli_id IS NOT NULL AND proc_prev_data_agendado_para IS NOT NULL;
COMMIT;
