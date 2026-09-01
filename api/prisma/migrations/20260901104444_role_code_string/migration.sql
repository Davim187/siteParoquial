-- Converte o código do perfil de enum para texto, preservando os dados existentes.
ALTER TABLE "Role" ALTER COLUMN "code" TYPE TEXT USING "code"::text;

-- Remove o enum antigo de perfis.
DROP TYPE "RoleCode";
