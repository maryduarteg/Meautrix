-- Etapa 1: aplicar antes de iniciar a versão com duração.
-- Não atribui duração arbitrária aos procedimentos existentes.
BEGIN;
ALTER TABLE public.procedimentos
    ADD COLUMN IF NOT EXISTS proc_duracao_minutos integer
    CHECK (proc_duracao_minutos > 0);
ALTER TABLE public.procedimentos_previstos
    ADD COLUMN IF NOT EXISTS proc_prev_duracao_minutos integer
    CHECK (proc_prev_duracao_minutos > 0);
COMMIT;
