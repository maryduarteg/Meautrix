-- Executar antes de utilizar Agendamento de Procedimentos.
-- Um agendamento recém-criado não possui usuário de cancelamento.
BEGIN;
ALTER TABLE public.procedimentos_previstos
    ALTER COLUMN usuarios_usu_cancelou_id DROP NOT NULL;
COMMIT;
