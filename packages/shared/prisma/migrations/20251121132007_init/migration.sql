-- CreateTable
CREATE TABLE `Backtesting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `strategyName` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `startBalance` DECIMAL(65, 30) NOT NULL,
    `endBalance` DECIMAL(65, 30) NOT NULL,
    `maxDrawdown` DECIMAL(65, 30) NOT NULL,
    `maxDrawdownPercent` DECIMAL(65, 30) NOT NULL,
    `totalNetPnl` DECIMAL(65, 30) NOT NULL,
    `totalReturnPercent` DECIMAL(65, 30) NOT NULL,
    `dailyResults` JSON NOT NULL,
    `trades` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bar` (
    `brokerName` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `open` DECIMAL(65, 30) NOT NULL,
    `high` DECIMAL(65, 30) NOT NULL,
    `low` DECIMAL(65, 30) NOT NULL,
    `close` DECIMAL(65, 30) NOT NULL,
    `volume` DECIMAL(65, 30) NOT NULL,

    UNIQUE INDEX `Bar_brokerName_symbol_timestamp_interval_key`(`brokerName`, `symbol`, `timestamp`, `interval`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BarOverview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brokerName` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `ranges` JSON NOT NULL,

    UNIQUE INDEX `BarOverview_brokerName_symbol_interval_key`(`brokerName`, `symbol`, `interval`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
