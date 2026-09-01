-- Permite missas com data específica além do horário semanal fixo.
ALTER TABLE "MassSchedule" ADD COLUMN "date" TIMESTAMP(3);
ALTER TABLE "MassSchedule" ALTER COLUMN "weekday" DROP NOT NULL;
CREATE INDEX "MassSchedule_date_active_idx" ON "MassSchedule"("date", "active");
