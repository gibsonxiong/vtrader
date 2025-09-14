<script lang="ts" setup>
import { Card, Table, Tag } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';

interface Trade {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  time: string;
  profit: number;
  commission: number;
}

interface TradingTableProps {
  backtestId?: number;
}

const props = defineProps<TradingTableProps>();

const state = reactive({
  loading: false,
  trades: [] as Trade[]
});

// 表格列定义
const columns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 150,
  },
  {
    title: '交易对',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 120,
  },
  {
    title: '方向',
    dataIndex: 'side',
    key: 'side',
    width: 80,
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    width: 120,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 100,
  },
  {
    title: '盈亏',
    dataIndex: 'profit',
    key: 'profit',
    width: 120,
  },
  {
    title: '手续费',
    dataIndex: 'commission',
    key: 'commission',
    width: 100,
  },
];

// 获取交易数据
const fetchTradingData = async () => {
  state.loading = true;
  try {
    // 模拟交易数据
    const mockTrades: Trade[] = [
      {
        id: 1,
        symbol: 'BTCUSDT',
        side: 'buy',
        price: 45000,
        quantity: 0.1,
        time: '2024-01-15 09:30:00',
        profit: 500,
        commission: 4.5
      },
      {
        id: 2,
        symbol: 'BTCUSDT',
        side: 'sell',
        price: 46000,
        quantity: 0.1,
        time: '2024-01-15 14:20:00',
        profit: 1000,
        commission: 4.6
      },
      {
        id: 3,
        symbol: 'ETHUSDT',
        side: 'buy',
        price: 2800,
        quantity: 1,
        time: '2024-01-16 10:15:00',
        profit: -200,
        commission: 2.8
      },
      {
        id: 4,
        symbol: 'ETHUSDT',
        side: 'sell',
        price: 2750,
        quantity: 1,
        time: '2024-01-16 16:45:00',
        profit: -50,
        commission: 2.75
      }
    ];
    
    state.trades = mockTrades;
  } catch (error) {
    console.error('获取交易数据失败:', error);
  } finally {
    state.loading = false;
  }
};

// 格式化数字
const formatNumber = (value: number, decimals: number = 2) => {
  return value.toFixed(decimals);
};

// 获取盈亏颜色
const getProfitColor = (profit: number) => {
  return profit >= 0 ? '#52c41a' : '#ff4d4f';
};

// 获取方向标签颜色
const getSideColor = (side: string) => {
  return side === 'buy' ? 'green' : 'red';
};

// 获取方向文本
const getSideText = (side: string) => {
  return side === 'buy' ? '买入' : '卖出';
};

onMounted(() => {
  fetchTradingData();
});
</script>

<template>
  <Card title="交易明细">
    <Table
      :columns="columns"
      :data-source="state.trades"
      :loading="state.loading"
      :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'side'">
          <Tag :color="getSideColor(record.side)">
            {{ getSideText(record.side) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'price'">
          <span>{{ formatNumber(record.price) }}</span>
        </template>
        <template v-else-if="column.key === 'quantity'">
          <span>{{ formatNumber(record.quantity, 4) }}</span>
        </template>
        <template v-else-if="column.key === 'profit'">
          <span :style="{ color: getProfitColor(record.profit), fontWeight: 'bold' }">
            {{ record.profit >= 0 ? '+' : '' }}{{ formatNumber(record.profit) }}
          </span>
        </template>
        <template v-else-if="column.key === 'commission'">
          <span>{{ formatNumber(record.commission) }}</span>
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