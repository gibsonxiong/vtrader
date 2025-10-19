/*
  Warnings:

  - Added the required column `dailyResults` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trades` to the `Backtesting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `backtesting` ADD COLUMN `dailyResults` JSON NOT NULL,
    ADD COLUMN `trades` JSON NOT NULL;
