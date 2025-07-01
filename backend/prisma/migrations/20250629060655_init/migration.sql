-- CreateTable
CREATE TABLE "Backtesting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Backtesting_name_key" ON "Backtesting"("name");
