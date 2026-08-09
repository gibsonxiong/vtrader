import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { EncryptedStringType } from '../types/custom/encrypted-string.type';
import type { BrokerModel, BrokerType } from '../types/broker';

@Entity({ tableName: 'broker' })
export class Broker implements BrokerModel {
  @PrimaryKey({ type: 'varchar', length: 36, defaultRaw: '(UUID())' })
  id!: string;

  @Property({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Property({ type: 'varchar', length: 50, fieldName: 'brokerType' })
  brokerType!: BrokerType;

  @Property({ type: EncryptedStringType, length: 500, fieldName: 'apiKey', hidden: true })
  apiKey!: string;

  @Property({ type: EncryptedStringType, length: 500, fieldName: 'apiSecret', hidden: true })
  apiSecret!: string;

  @Property({ type: 'json', nullable: true })
  settings?: Record<string, any>;

  @Property({ type: 'boolean', default: true, fieldName: 'isActive' })
  isActive = true;

  @Property({ type: 'datetime', defaultRaw: 'now()', fieldName: 'createdAt' })
  createdAt = new Date();

  @Property({ type: 'datetime', defaultRaw: 'now()', onUpdate: () => new Date(), fieldName: 'updatedAt' })
  updatedAt = new Date();
}
