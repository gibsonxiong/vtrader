const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

function getMarketDataDir() {
  return path.resolve(__dirname, '../data')
}

function getSafeSymbol(symbol) {
  return symbol.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

function getBrokerDir(brokerName) {
  return path.resolve(getMarketDataDir(), brokerName)
}

function getBarMetaFilePath(brokerName, symbol, interval) {
  return path.resolve(getBrokerDir(brokerName), `${getSafeSymbol(symbol)}_${interval}.meta.json`)
}

async function main() {
  const prisma = new PrismaClient()

  try {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT `brokerName`, `symbol`, `interval`, `ranges` FROM `BarOverview`',
    )

    let migrated = 0
    for (const row of rows) {
      fs.mkdirSync(getBrokerDir(row.brokerName), { recursive: true })

      const meta = {
        version: 1,
        brokerName: row.brokerName,
        symbol: row.symbol,
        interval: row.interval,
        ranges: typeof row.ranges === 'string' ? JSON.parse(row.ranges) : row.ranges,
        updatedAt: new Date().toISOString(),
      }

      fs.writeFileSync(
        getBarMetaFilePath(row.brokerName, row.symbol, row.interval),
        JSON.stringify(meta, null, 2),
      )
      migrated++
    }

    console.log(`migrated ${migrated} bar overview records to meta files`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
