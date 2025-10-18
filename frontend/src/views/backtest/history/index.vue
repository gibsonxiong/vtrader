<script lang="ts" setup>
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vtrader/common-ui';
import { Tag, Form, Input, Select, Button, Row, Col, message, Modal } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistoryApi, type BacktestingApi } from '#/api';
import type { BacktestingSetting } from '@vtrader/shared';
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
    { 
      field: 'maxDrawdownPercent', 
      title: '最大回撤', 
      width: 120,
      formatter: ({ cellValue }) => Number(cellValue).toFixed(2) + '%'
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
    enabled: true,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  sortConfig: {
    multiple: true,
  },
};

const gridEvents: VxeGridListeners<any> = {};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

const router = useRouter();

// 查询参数状态
const queryParams = reactive({
  class_name: '',
  vt_symbol: '',
  interval: '',
  limit: 100,
  offset: 0,
});

const fetchData = async (params?: Partial<typeof queryParams>) => {
  state.loading = true;
  updateGridData(); // 更新loading状态
  
  try {
    // 构建查询参数
    const finalParams: BacktestingApi.BacktestQueryParams = {
      ...queryParams,
      ...params
    };
    
    // 过滤掉空值
    const filteredParams = Object.fromEntries(
      Object.entries(finalParams).filter(([_, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    ) as BacktestingApi.BacktestQueryParams;
    
    const response = await getBacktestHistoryApi(filteredParams);
    state.data = response.data?.data || [];
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
  queryParams.class_name = '';
  queryParams.vt_symbol = '';
  queryParams.interval = '';
  queryParams.limit = 100;
  queryParams.offset = 0;
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
    path: '/backtest/result',
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
        // await axios.delete(`http://127.0.0.1:8000/backtesting/results/${record.id}`);
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
                  v-model:value="queryParams.class_name"
                  placeholder="请输入策略类名"
                  allow-clear
                />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="交易品种">
                <Input
                  v-model:value="queryParams.vt_symbol"
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
              <Form.Item label="返回记录数限制">
                <Input
                  v-model:value="queryParams.limit"
                  placeholder="请输入限制数量"
                  type="number"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row :gutter="16" class="w-full mt-2">
            <Col :span="6">
              <Form.Item label="偏移量">
                <Input
                  v-model:value="queryParams.offset"
                  placeholder="请输入偏移量"
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
