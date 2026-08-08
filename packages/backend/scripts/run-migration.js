const mysql = require('mysql2');

function getConnection() {
  return new Promise((resolve, reject) => {
    const conn = mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Qwer1234',
      database: 'vtrader',
    });
    conn.connect(err => err ? reject(err) : resolve(conn));
  });
}

function exec(conn, sql, params) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params || [], (err, result) => err ? reject(err) : resolve(result));
  });
}

async function run() {
  const conn = await getConnection();
  console.log('Connected to MySQL');

  // 1. Drop bar table
  await exec(conn, 'DROP TABLE IF EXISTS `bar`');
  console.log('Dropped bar table');

  // 2. Drop _prisma_migrations table
  await exec(conn, 'DROP TABLE IF EXISTS `_prisma_migrations`');
  console.log('Dropped _prisma_migrations table');

  // 3. Drop and recreate backtesting table
  await exec(conn, 'DROP TABLE IF EXISTS `backtesting`');
  console.log('Dropped backtesting table');

  await exec(conn, `
    CREATE TABLE \`backtesting\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`brokerId\` VARCHAR(255) NOT NULL,
      \`strategyName\` VARCHAR(255) NOT NULL,
      \`symbol\` VARCHAR(50) NOT NULL,
      \`interval\` VARCHAR(20) NOT NULL,
      \`startDate\` VARCHAR(20) NOT NULL,
      \`endDate\` VARCHAR(20) NOT NULL,
      \`startBalance\` DECIMAL(30,8) NOT NULL,
      \`endBalance\` DECIMAL(30,8) NOT NULL,
      \`maxDrawdown\` DECIMAL(30,8) NOT NULL,
      \`maxDrawdownPercent\` DECIMAL(30,8) NOT NULL,
      \`totalNetPnl\` DECIMAL(30,8) NOT NULL,
      \`totalReturnPercent\` DECIMAL(30,8) NOT NULL,
      \`dailyResults\` JSON NOT NULL,
      \`trades\` JSON NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Created backtesting table');

  // 4. Create mikro_orm_migrations table
  await exec(conn, `
    CREATE TABLE IF NOT EXISTS \`mikro_orm_migrations\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`executed_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Created mikro_orm_migrations table');

  // 5. Insert migration record
  await exec(conn, 'INSERT INTO `mikro_orm_migrations` (`name`) VALUES (?)', ['Migration20240807']);
  console.log('Recorded migration');

  conn.end();
  console.log('Migration completed successfully');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
