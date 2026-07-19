<script lang="ts" setup>
import { Tag, Form, Input, Button, message, Modal, Table } from 'ant-design-vue';
import { reactive, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistoryApi, removeBacktestHistoryApi } from '#/api';
import dayjs from 'dayjs';
import BacktestStartModal from '#/components/BacktestStartModal/index.vue';

defineOptions({ name: 'BacktestHistory' });

const defaultQuery = { strategyName: '', symbol: '', interval: '', current: 1, pageSize: 10 };
const queryParams = reactive({ ...defaultQuery });
const state = reactive({ data: [] as any[], loading: false, total: 0 });
const router = useRouter();
const backtestModalVisible = ref(false);

const columns = [
  { dataIndex: 'id', title: 'ID', width: 40 },
  { dataIndex: 'strategyName', title: '策略', width: 60, ellipsis: true },
  { dataIndex: 'symbol', title: '交易对', width: 110, ellipsis: true },
  { dataIndex: 'interval', title: '周期', width: 45 },
  { dataIndex: 'startDate', title: '开始', width: 70 },
  { dataIndex: 'endDate', title: '结束', width: 70 },
  { dataIndex: 'totalReturnPercent', title: '收益', width: 65 },
  { dataIndex: 'maxDrawdownPercent', title: '回撤', width: 65 },
  { dataIndex: 'actions', title: '操作', width: 70 },
];

const fetchData = async () => {
  state.loading = true;
  try {
    const response = await getBacktestHistoryApi({
      where: { strategyName: queryParams.strategyName, symbol: queryParams.symbol, interval: queryParams.interval },
      take: queryParams.pageSize,
      skip: (queryParams.current - 1) * queryParams.pageSize,
    });
    state.data = response.data?.data.models || [];
    state.total = response.data?.data.total || 0;
  } catch { state.data = []; state.total = 0; }
  finally { state.loading = false; }
};

const handleSearch = () => { queryParams.current = 1; fetchData(); };
const handleReset = () => { Object.assign(queryParams, defaultQuery); fetchData(); };
const handleView = (record: any) => router.push({ path: '/backtesting/result', query: { resultId: record.id } });
const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除', content: `确定删除ID为 ${record.id} 的记录吗？`,
    onOk: async () => { try { await removeBacktestHistoryApi({ id: record.id }); message.success('已删除'); fetchData(); } catch { message.error('删除失败'); } },
  });
};
const handleTableChange = (pag: any) => { queryParams.current = pag.current; queryParams.pageSize = pag.pageSize; fetchData(); };
const handleBacktestSuccess = (resultId: string) => { message.success('回测启动成功'); fetchData(); router.push({ path: '/backtesting/result', query: { resultId } }); };

onMounted(fetchData);
</script>

<template>
  <div class="mobile-page">
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
      <Input v-model:value="queryParams.strategyName" placeholder="策略名" size="small" style="flex:1;min-width:80px" allow-clear />
      <Input v-model:value="queryParams.symbol" placeholder="交易对" size="small" style="flex:1;min-width:80px" allow-clear />
      <Button type="primary" size="small" @click="handleSearch" :loading="state.loading">查询</Button>
      <Button size="small" @click="handleReset">重置</Button>
    </div>
    <div style="margin-bottom:8px">
      <Button type="primary" size="small" block @click="backtestModalVisible = true">开始回测</Button>
    </div>
    <Table
      :columns="columns" :data-source="state.data" :loading="state.loading"
      :pagination="{ current: queryParams.current, pageSize: queryParams.pageSize, total: state.total, size: 'small' }"
      :scroll="{ x: 550 }" size="small" row-key="id" @change="handleTableChange"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.dataIndex === 'startDate' || column.dataIndex === 'endDate'">{{ dayjs(text).format('MM-DD') }}</template>
        <template v-else-if="column.dataIndex === 'totalReturnPercent'">
          <Tag v-if="text != null" :color="text >= 0 ? 'green' : 'red'">{{ (text * 100).toFixed(1) }}%</Tag>
          <span v-else>--</span>
        </template>
        <template v-else-if="column.dataIndex === 'maxDrawdownPercent'">
          <Tag v-if="text != null" :color="text <= 0 ? 'green' : 'red'">{{ (text * 100).toFixed(1) }}%</Tag>
          <span v-else>--</span>
        </template>
        <template v-else-if="column.dataIndex === 'actions'">
          <Button type="link" size="small" @click="handleView(record)">查看</Button>
          <Button type="link" size="small" danger @click="handleDelete(record)">删</Button>
        </template>
      </template>
    </Table>
    <BacktestStartModal v-model:open="backtestModalVisible" @success="handleBacktestSuccess" />
  </div>
</template>

<style scoped>
.mobile-page { padding: 0; }
</style>
