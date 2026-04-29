-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleCategory" ADD VALUE 'FULL_STACK';
ALTER TYPE "RoleCategory" ADD VALUE 'DEVSECOPS';
ALTER TYPE "RoleCategory" ADD VALUE 'DATA_ANALYST';
ALTER TYPE "RoleCategory" ADD VALUE 'AI_ENGINEER';
ALTER TYPE "RoleCategory" ADD VALUE 'AI_AND_DATA_SCIENTIST';
ALTER TYPE "RoleCategory" ADD VALUE 'DATA_ENGINEER';
ALTER TYPE "RoleCategory" ADD VALUE 'ANDROID';
ALTER TYPE "RoleCategory" ADD VALUE 'MACHINE_LEARNING';
ALTER TYPE "RoleCategory" ADD VALUE 'POSTGRESQL';
ALTER TYPE "RoleCategory" ADD VALUE 'IOS';
ALTER TYPE "RoleCategory" ADD VALUE 'BLOCKCHAIN';
ALTER TYPE "RoleCategory" ADD VALUE 'QA';
ALTER TYPE "RoleCategory" ADD VALUE 'SOFTWARE_ARCHITECT';
ALTER TYPE "RoleCategory" ADD VALUE 'CYBER_SECURITY';
ALTER TYPE "RoleCategory" ADD VALUE 'UX_DESIGN';
ALTER TYPE "RoleCategory" ADD VALUE 'TECHNICAL_WRITER';
ALTER TYPE "RoleCategory" ADD VALUE 'GAME_DEVELOPER';
ALTER TYPE "RoleCategory" ADD VALUE 'SERVER_SIDE_GAME_DEVELOPER';
ALTER TYPE "RoleCategory" ADD VALUE 'MLOPS';
ALTER TYPE "RoleCategory" ADD VALUE 'PRODUCT_MANAGER';
ALTER TYPE "RoleCategory" ADD VALUE 'ENGINEERING_MANAGER';
ALTER TYPE "RoleCategory" ADD VALUE 'DEVELOPER_RELATIONS';
ALTER TYPE "RoleCategory" ADD VALUE 'BI_ANALYST';
