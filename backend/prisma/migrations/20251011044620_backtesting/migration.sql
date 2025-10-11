/*
  Warnings:

  - You are about to drop the column `name` on the `backtesting` table. All the data in the column will be lost.
  - Added the required column `endBalance` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDrawdown` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDrawdownPercent` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startBalance` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalNetPnl` to the `Backtesting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalReturnPercent` to the `Backtesting` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Backtesting_name_key` ON `backtesting`;

-- AlterTable
ALTER TABLE `backtesting` DROP COLUMN `name`,
    ADD COLUMN `endBalance` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `endDate` VARCHAR(191) NOT NULL,
    ADD COLUMN `maxDrawdown` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `maxDrawdownPercent` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `startBalance` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `startDate` VARCHAR(191) NOT NULL,
    ADD COLUMN `symbol` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalNetPnl` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `totalReturnPercent` DECIMAL(65, 30) NOT NULL;
