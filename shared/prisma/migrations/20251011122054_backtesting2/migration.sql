/*
  Warnings:

  - Added the required column `interval` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strategyName` to the `Backtesting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `backtesting` ADD COLUMN `interval` VARCHAR(191) NOT NULL,
    ADD COLUMN `strategyName` VARCHAR(191) NOT NULL;
