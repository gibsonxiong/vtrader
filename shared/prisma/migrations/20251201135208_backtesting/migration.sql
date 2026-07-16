/*
  Warnings:

  - Added the required column `brokerId` to the `Backtesting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Backtesting` ADD COLUMN `brokerId` VARCHAR(191) NOT NULL;
