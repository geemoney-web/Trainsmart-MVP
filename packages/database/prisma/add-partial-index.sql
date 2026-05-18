CREATE UNIQUE INDEX IF NOT EXISTS "rtos_asqa_code_active_unique" ON "rtos" ("asqa_code") WHERE "deleted_at" IS NULL;
