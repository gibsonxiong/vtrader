import 'dotenv/config';
import { defineConfig } from '@mikro-orm/mysql';
import { Migrator } from '@mikro-orm/migrations';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Broker } from './entities/broker.entity';
import { Backtesting } from './entities/backtesting.entity';

export default defineConfig({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'vtrader',
  entities: [Broker, Backtesting],
  entitiesTs: ['./src/entities'],
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator],
  migrations: {
    path: './src/migrations',
    pathTs: './src/migrations',
  },
  debug: process.env.NODE_ENV !== 'production',
  allowGlobalContext: true,
});
