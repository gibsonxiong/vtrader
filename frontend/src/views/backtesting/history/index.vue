<script lang="ts" setup>
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vtrader/common-ui';
import { Tag, Form, Input, Select, Button, Row, Col, message, Modal } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistoryApi, removeBacktestHistoryApi } from '#/api';
import type { BacktestingApi } from '@vtrader/shared';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

const state = reactive({
  data: [] as any[],
  loading: false,
});

const gridOptions: VxeGridProps<any> = {
  columns: [
    { field: 'id', title: 'ID', width: 60 },
    { field: 'strategyName', title: '策略名称', width: 150 },
    { field: 'symbol', title: '交易对', width: 180 },
    { field: 'interval', title: '时间间隔', width: 80 },
    { 
      field: 'startDate', 
      title: '开始时间', 
      width: 120,
      formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD')
    },
    { 
      field: 'endDate', 
      title: '结束时间', 
      width: 120,
      formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD')
    },
    { 
      field: 'startBalance', 
      title: '初始资金', 
      width: 120,
      formatter: ({ cellValue }) => cellValue.toLocaleString()
    },
    { 
      field: 'totalReturnPercent', 
      title: '总收益率', 
      width: 120,
      slots: { default: 'totalReturnPercent' }
    },
    // { 
    //   field: 'maxDrawdown', 
    //   title: '最大回撤', 
    //   width: 120,
    //   formatter: ({ cellValue }) => Number(cellValue).toLocaleString()
    // },
    { 
      field: 'maxDrawdownPercent', 
      title: '最大回撤率', 
      width: 120,
      formatter: ({ cellValue }) => Number(cellValue * 100).toFixed(2) + '%'
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' }
    },
  ],
  data: state.data,
  loading: state.loading,
  pagerConfig: {
    enabled: false,
    // pageSize: 10,
    // pageSizes: [10, 20, 50, 100],
  },
  sortConfig: {
    multiple: true,
  },
};

const gridEvents: VxeGridListeners<any> = {};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

const router = useRouter();

// 查询参数状态
const defaultQuery = {
  strategyName: '',
  symbol: '',
  interval: undefined,
  currentPage: 1,
  pageSize: 10,
};
const queryParams = reactive({...defaultQuery});

const fetchData = async () => {
  state.loading = true;
  updateGridData(); // 更新loading状态
  
  try {
    const response = await getBacktestHistoryApi({
      where: {
        // strategyName: queryParams.strategyName,
        // symbol: queryParams.symbol,
        interval: queryParams.interval,
      },
      take: queryParams.pageSize,
      skip: (queryParams.currentPage - 1) * queryParams.pageSize,
    });
    state.data = response.data?.data.models || [];
  } catch (error) {
    console.error('获取回测历史数据失败:', error);
    state.data = [];
  } finally {
    state.loading = false;
    updateGridData(); // 更新数据和loading状态
  }
};

// 查询按钮处理
const handleSearch = () => {
  fetchData();
};

// 重置按钮处理
const handleReset = () => {
    Object.keys(queryParams).forEach(key => {
      (queryParams as any)[key] = (defaultQuery as any)[key];
    });
    // queryParams.currentPage = defaultQuery.currentPage;
    // queryParams.currentPage = defaultQuery.currentPage;
  fetchData();
};

// 监听数据变化，更新表格数据
const updateGridData = () => {
  gridApi.setGridOptions({
    data: state.data,
    loading: state.loading,
  });
};

// 查看详情
const handleView = (record: any) => {
  router.push({
    path: '/backtesting/result',
    query: { resultId: record.id }
  });
};

// 删除记录
const handleDelete = async (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除ID为 ${record.id} 的回测记录吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await removeBacktestHistoryApi({ id: record.id });
        message.success('删除成功');
        fetchData(); // 刷新表格数据
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page title="回测历史">
    <div class="p-4">
      <!-- 查询表单 -->
      <div class="mb-4 p-4 bg-gray-50 rounded">
        <Form layout="inline" :model="queryParams">
          <Row :gutter="16" class="w-full">
            <Col :span="6">
              <Form.Item label="策略类名">
                <Input
                  v-model:value="queryParams.strategyName"
                  placeholder="请输入策略类名"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="交易品种">
                <Input
                  v-model:value="queryParams.symbol"
                  placeholder="请输入交易品种"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="时间周期">
                <Input
                  v-model:value="queryParams.interval"
                  placeholder="请输入时间周期"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="每页记录数">
                <Input
                  v-model:value.number="queryParams.pageSize"
                  placeholder="请输入每页记录数"
                  type="number"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row :gutter="16" class="w-full mt-2">
            <Col :span="6">
              <Form.Item label="当前页">
                <Input
                  v-model:value.number="queryParams.currentPage"
                  placeholder="请输入当前页"
                  type="number"
                />
              </Form.Item>
            </Col>
            <Col :span="18" class="text-right">
              <Form.Item>
                <Button type="primary" @click="handleSearch" :loading="state.loading">
                  查询
                </Button>
                <Button @click="handleReset" class="ml-2">
                  重置
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
      
      <!-- 数据表格 -->
      <Grid table-title="回测历史数据">
        <template #totalReturnPercent="{ row }">
          <span v-if="row.totalReturnPercent == null || row.totalReturnPercent === ''">--</span>
          <Tag v-else :color="row.totalReturnPercent >= 0 ? 'green' : 'red'">
            {{ (row.totalReturnPercent * 100).toFixed(2) }}%
          </Tag>
        </template>
        <template #maxDrawdownPercent="{ row }">
          <span v-if="row.maxDrawdownPercent == null || row.maxDrawdownPercent === ''">--</span>
          <Tag v-else color="red">
            {{ (row.maxDrawdownPercent * 100).toFixed(2) }}%
          </Tag>
        </template>
        <template #actions="{ row }">
          <Button type="link" size="small" @click="handleView(row)">
            查看
          </Button>
          <Button type="link" size="small" danger @click="handleDelete(row)">
            删除
          </Button>
        </template>
      </Grid>
    </div>
  </Page>
</template>
