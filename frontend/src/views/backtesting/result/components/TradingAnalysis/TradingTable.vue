<script lang="ts" setup>
import { Card, Table, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { TradeData } from '@vtrader/shared';
import { globalTableConfig } from '#/config/table';

interface TradingTableProps {
  trades?: TradeData[];
}

const props = defineProps<TradingTableProps>();

// 表格列定义
const columns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
  },
  {
    title: '合约',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 160,
  },
  {
    title: '方向',
    dataIndex: 'direction',
    key: 'direction',
    width: 100,
  },
  {
    title: '开平',
    dataIndex: 'offset',
    key: 'offset',
    width: 100,
  },
  {
    title: '成交价',
    dataIndex: 'price',
    key: 'price',
    width: 140,
  },
  {
    title: '成交量',
    dataIndex: 'volume',
    key: 'volume',
    width: 120,
  },
  {
    title: '手续费',
    dataIndex: 'commission',
    key: 'commission',
    width: 120,
  },
];

// 格式化数字
const formatNumber = (value: number, decimals: number = 2) => {
  return value.toFixed(decimals);
};

// 格式化时间
const formatTime = (iso: string) => {
  return dayjs(iso).format('YYYY-MM-DD HH:mm:ss');
};

// 获取方向标签颜色
const getDirectionColor = (direction: 'long' | 'short') => {
  return direction === 'long' ? 'green' : 'red';
};

// 获取方向文本
const getDirectionText = (direction: 'long' | 'short') => {
  return direction === 'long' ? '多' : '空';
};

// 获取开平标签颜色
const getOffsetColor = (offset: 'open' | 'close') => {
  return offset === 'open' ? 'blue' : 'orange';
};

// 获取开平文本
const getOffsetText = (offset: 'open' | 'close') => {
  return offset === 'open' ? '开仓' : '平仓';
};

</script>

<template>
  <Card title="交易明细">
    <Table
      :columns="columns"
      :data-source="props.trades"
      :pagination="{
        pageSize: globalTableConfig.pagination.defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: globalTableConfig.pagination.pageSizes.map(String),
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
      }"
      row-key="tradeId"
      size="middle"
      @row-click="handleRowClick"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'direction'">
          <Tag :color="getDirectionColor(record.direction)">
            {{ getDirectionText(record.direction) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'offset'">
          <Tag :color="getOffsetColor(record.offset)">
            {{ getOffsetText(record.offset) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'price'">
          <span>{{ formatNumber(record.price) }}</span>
        </template>
        <template v-else-if="column.key === 'volume'">
          <span>{{ formatNumber(record.volume, 6) }}</span>
        </template>
        <template v-else-if="column.key === 'commission'">
          <span>{{ formatNumber(record.commission, 6) }}</span>
        </template>
        <template v-else-if="column.key === 'time'">
          <span>{{ formatTime(record.time) }}</span>
        </template>
      </template>
    </Table>
  </Card>
</template>

<style scoped>
.ant-card {
  border-radius: 8px;
}
</style>
