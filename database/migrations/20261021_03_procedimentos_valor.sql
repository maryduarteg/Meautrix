-- Preserva os procedimentos existentes sem atribuir um preço arbitrário.
BEGIN;
ALTER TABLE public.procedimentos
    ADD COLUMN IF NOT EXISTS proc_valor numeric(10,2);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_procedimentos_valor'
          AND conrelid = 'public.procedimentos'::regclass) THEN
        ALTER TABLE public.procedimentos ADD CONSTRAINT ck_procedimentos_valor
            CHECK (proc_valor >= 0 AND proc_valor <= 99999999.99);
    END IF;
END $$;
COMMIT;
