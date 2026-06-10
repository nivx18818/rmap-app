/*
  Warnings:

  - Made the column `avatar_url` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "avatar_url" SET NOT NULL;
