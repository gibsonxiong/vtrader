<script lang="ts" setup>
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { Tag, Form, Input, Select, Button, Row, Col, message, Modal } from 'ant-design-vue';
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface BacktestRecord {
  id: number;
  class_name: string;
  vt_symbol: string;
  interval: string;
  start: string;
  end: string;
  rate: number;
  slippage: number;
  size: number;
  pricetick: number;
  capital: number;
  setting: string;
  status: string;
  total_return: number | null;
  annual_return: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  total_trades: number | null;
  win_rate: number | null;
  created_time: string;
  updated_time: string;
}

const state = reactive({
  data: [] as BacktestRecord[],
  loading: false,
});

const gridOptions: VxeGridProps<BacktestRecord> = {
  columns: [
    { field: 'id', title: 'ID', width: 60 },
    { field: 'class_name', title: '策略名称', width: 150 },
    { field: 'vt_symbol', title: '交易对', width: 180 },
    { field: 'interval', title: '时间间隔', width: 80 },
    { 
      field: 'start', 
      title: '开始时间', 
      width: 120,
      formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD')
    },
    { 
      field: 'end', 
      title: '结束时间', 
      width: 120,
      formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD')
    },
    { 
      field: 'status', 
      title: '回测状态', 
      width: 120,
      slots: { default: 'status' }
    },
    { 
      field: 'rate', 
      title: '手续费率', 
      width: 100,
      formatter: ({ cellValue }) => (cellValue * 100).toFixed(3) + '%'
    },
    { field: 'slippage', title: '滑点', width: 80 },
    { field: 'size', title: '合约大小', width: 100 },
    { field: 'pricetick', title: '最小价格变动', width: 120 },
    { 
      field: 'capital', 
      title: '初始资金', 
      width: 120,
      formatter: ({ cellValue }) => cellValue.toLocaleString()
    },
    { 
      field: 'total_return', 
      title: '总收益率', 
      width: 120,
      slots: { default: 'total_return' }
    },
    { 
      field: 'annual_return', 
      title: '年化收益率', 
      width: 120,
      slots: { default: 'annual_return' }
    },
    { 
      field: 'max_drawdown', 
      title: '最大回撤', 
      width: 120,
      slots: { default: 'max_drawdown' }
    },
    { 
      field: 'sharpe_ratio', 
      title: '夏普比率', 
      width: 100,
      formatter: ({ cellValue }) => cellValue == null || cellValue === '' ? '--' : cellValue.toFixed(3)
    },
    { 
      field: 'total_trades', 
      title: '总交易次数', 
      width: 120,
      formatter: ({ cellValue }) => cellValue == null || cellValue === '' ? '--' : cellValue
    },
    { 
      field: 'win_rate', 
      title: '胜率', 
      width: 100,
      formatter: ({ cellValue }) => cellValue == null || cellValue === '' ? '--' : cellValue.toFixed(2) + '%'
    },
    { 
      field: 'created_time', 
      title: '创建时间', 
      width: 160,
      formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss')
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

const gridEvents: VxeGridListeners<BacktestRecord> = {};

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
    const searchParams = new URLSearchParams();
    
    // 合并传入的参数
    const finalParams = { ...queryParams, ...params };
    
    // 只添加非空的查询参数
    Object.entries(finalParams).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    const response = await axios.get(`http://127.0.0.1:8000/backtesting/results?${searchParams.toString()}`);
    state.data = response.data;
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
const handleView = (record: BacktestRecord) => {
  router.push({
    path: '/backtest/result',
    query: { resultId: record.id }
  });
};

// 删除记录
const handleDelete = async (record: BacktestRecord) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除ID为 ${record.id} 的回测记录吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await axios.delete(`http://127.0.0.1:8000/backtesting/results/${record.id}`);
        message.success('删除成功');
        fetchData(); // 刷新表格数据
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  });
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'inited': 'default',
    'data_loading': 'processing',
    'backtesting': 'processing',
    'analysing': 'processing',
    'finished': 'success',
    'failed': 'error'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'inited': '已初始化',
    'data_loading': '数据加载中',
    'backtesting': '回测中',
    'analysing': '分析中',
    'finished': '已完成',
    'failed': '失败'
  };
  return textMap[status] || status;
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
        <template #total_return="{ row }">
          <span v-if="row.total_return == null || row.total_return === ''">--</span>
          <Tag v-else :color="row.total_return >= 0 ? 'green' : 'red'">
            {{ (row.total_return * 100).toFixed(2) }}%
          </Tag>
        </template>
        <template #annual_return="{ row }">
          <span v-if="row.annual_return == null || row.annual_return === ''">--</span>
          <Tag v-else :color="row.annual_return >= 0 ? 'green' : 'red'">
            {{ (row.annual_return * 100).toFixed(2) }}%
          </Tag>
        </template>
        <template #max_drawdown="{ row }">
          <span v-if="row.max_drawdown == null || row.max_drawdown === ''">--</span>
          <Tag v-else color="red">
            {{ (row.max_drawdown * 100).toFixed(2) }}%
          </Tag>
        </template>
        <template #status="{ row }">
          <Tag :color="getStatusColor(row.status)">
            {{ getStatusText(row.status) }}
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
