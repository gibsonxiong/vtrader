-- CreateTable
CREATE TABLE `Backtesting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Backtesting_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `symbol` VARCHAR(191) NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `open` DECIMAL(65, 30) NOT NULL,
    `high` DECIMAL(65, 30) NOT NULL,
    `low` DECIMAL(65, 30) NOT NULL,
    `close` DECIMAL(65, 30) NOT NULL,
    `volume` DECIMAL(65, 30) NOT NULL,
    `interval` VARCHAR(191) NOT NULL,
    `openInterest` DECIMAL(65, 30) NULL,

    UNIQUE INDEX `Bar_symbol_timestamp_interval_key`(`symbol`, `timestamp`, `interval`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
