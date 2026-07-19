<script lang="ts" setup>
import PageContainer from '#/components/PageContainer.vue';
import { Tag, Form, Input, Button, Row, Col, message, Modal, Table } from 'ant-design-vue';
import { reactive, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistoryApi, removeBacktestHistoryApi } from '#/api';
import dayjs from 'dayjs';

import BacktestStartModal from '#/components/BacktestStartModal/index.vue';

const defaultQuery = {
  strategyName: '',
  symbol: '',
  interval: '',
  current: 1,
  pageSize: 20,
};
const queryParams = reactive({ ...defaultQuery });

const state = reactive({
  data: [] as any[],
  loading: false,
  total: 0,
});

const columns = [
  { dataIndex: 'id', title: 'ID', width: 60 },
  { dataIndex: 'strategyName', title: '策略名称', width: 150 },
  { dataIndex: 'symbol', title: '交易对', width: 180 },
  { dataIndex: 'interval', title: '时间间隔', width: 120 },
  { dataIndex: 'startDate', title: '开始时间', width: 120 },
  { dataIndex: 'endDate', title: '结束时间', width: 120 },
  { dataIndex: 'startBalance', title: '初始资金', width: 120 },
  { dataIndex: 'totalReturnPercent', title: '总收益率', width: 120, sorter: true },
  { dataIndex: 'maxDrawdownPercent', title: '最大回撤率', width: 120, sorter: true },
  { dataIndex: 'actions', title: '操作', fixed: 'right', width: 150 },
];

const router = useRouter();
const backtestModalVisible = ref(false);

const handleStartBacktest = () => {
  backtestModalVisible.value = true;
};

const handleBacktestSuccess = (resultId: string) => {
  message.success('回测启动成功！');
  fetchData();
  router.push({ path: '/backtesting/result', query: { resultId } });
};

const fetchData = async () => {
  state.loading = true;
  try {
    const response = await getBacktestHistoryApi({
      where: {
        strategyName: queryParams.strategyName,
        symbol: queryParams.symbol,
        interval: queryParams.interval,
      },
      take: queryParams.pageSize,
      skip: (queryParams.current - 1) * queryParams.pageSize,
    });
    state.data = response.data?.data.models || [];
    state.total = response.data?.data.total || 0;
  } catch {
    state.data = [];
    state.total = 0;
  } finally {
    state.loading = false;
  }
};

const handleSearch = () => {
  queryParams.current = 1;
  fetchData();
};

const handleReset = () => {
  Object.assign(queryParams, defaultQuery);
  fetchData();
};

const handleView = (record: any) => {
  router.push({ path: '/backtesting/result', query: { resultId: record.id } });
};

const handleDelete = async (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除ID为 ${record.id} 的回测记录吗？`,
    onOk: async () => {
      try {
        await removeBacktestHistoryApi({ id: record.id });
        message.success('删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      }
    },
  });
};

const handleTableChange = (pag: any) => {
  queryParams.current = pag.current;
  queryParams.pageSize = pag.pageSize;
  fetchData();
};

onMounted(() => fetchData());
</script>

<template>
  <PageContainer>
    <div class="mb-4 p-4 bg-card rounded">
      <Form layout="inline" :model="queryParams">
        <Row :gutter="16" class="w-full">
          <Col :span="6">
            <Form.Item label="策略类名">
              <Input v-model:value="queryParams.strategyName" placeholder="请输入策略类名" allow-clear />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="交易品种">
              <Input v-model:value="queryParams.symbol" placeholder="请输入交易品种" allow-clear />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="时间周期">
              <Input v-model:value="queryParams.interval" placeholder="请输入时间周期" allow-clear />
            </Form.Item>
          </Col>
          <Col style="display:flex;align-items:center">
            <Button type="primary" @click="handleSearch" :loading="state.loading">查询</Button>
            <Button @click="handleReset" class="ml-2">重置</Button>
          </Col>
        </Row>
      </Form>
    </div>

    <div style="margin-bottom: 16px">
      <Button type="primary" @click="handleStartBacktest">开始回测</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="state.data"
      :loading="state.loading"
      :pagination="{ current: queryParams.current, pageSize: queryParams.pageSize, total: state.total, showSizeChanger: true }"
      :scroll="{ x: 1200 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.dataIndex === 'startDate' || column.dataIndex === 'endDate'">
          {{ dayjs(text).format('YYYY-MM-DD') }}
        </template>
        <template v-else-if="column.dataIndex === 'startBalance'">
          {{ text?.toLocaleString() }}
        </template>
        <template v-else-if="column.dataIndex === 'totalReturnPercent'">
          <span v-if="text == null">--</span>
          <Tag v-else :color="text >= 0 ? 'green' : 'red'">{{ (text * 100).toFixed(2) }}%</Tag>
        </template>
        <template v-else-if="column.dataIndex === 'maxDrawdownPercent'">
          <span v-if="text == null">--</span>
          <Tag v-else :color="text >= 0 ? 'green' : 'red'">{{ (text * 100).toFixed(2) }}%</Tag>
        </template>
        <template v-else-if="column.dataIndex === 'actions'">
          <Button type="link" size="small" @click="handleView(record)">查看</Button>
          <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
        </template>
      </template>
    </Table>

    <BacktestStartModal v-model:open="backtestModalVisible" @success="handleBacktestSuccess" />
  </PageContainer>
</template>
