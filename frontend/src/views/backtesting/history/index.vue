<script lang="ts" setup>
import type { VxeGridListeners, VxeGridProps, VxeTablePropTypes } from '#/adapter/vxe-table';

import { Page } from '@vtrader/common-ui';
import { Tag, Form, Input, Select, Button, Row, Col, message, Modal } from 'ant-design-vue';
import { reactive, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getBacktestHistoryApi, removeBacktestHistoryApi } from '#/api';
import type { BacktestingApi } from '@vtrader/shared';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import BacktestStartModal from '#/components/BacktestStartModal/index.vue';
import { globalTableConfig } from '#/config/table';

// 查询参数状态
const defaultQuery = {
  strategyName: '',
  symbol: '',
  interval: '',
  currentPage: globalTableConfig.pagination.defaultCurrentPage,
  pageSize: globalTableConfig.pagination.defaultPageSize,
};
const queryParams = reactive({...defaultQuery});

const sortObj = reactive({
  field: 'startDate',
  order: 'desc' as VxeTablePropTypes.SortOrder,
});

const state = reactive({
  data: [] as any[],
  loading: false,
  total: 0,
});

const gridOptions: VxeGridProps<any> = {
  columns: [
    { field: 'id', title: 'ID', width: 60 },
    { field: 'strategyName', title: '策略名称', width: 150 },
    { field: 'symbol', title: '交易对', width: 180 },
    { field: 'interval', title: '时间间隔', width: 120 },
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
      sortable: true,
      className: ({ row }) => row.totalReturnPercent > 0 ? 'text-red-500' : 'text-green-500',
      formatter: ({ cellValue }) => Number(cellValue * 100).toFixed(2) + '%'
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
      sortable: true,
      className: ({ row }) => row.maxDrawdownPercent > 0 ? 'text-red-500' : 'text-green-500',
      formatter: ({ cellValue }) => Number(cellValue * 100).toFixed(2) + '%'
    },
    {
      field: 'actions',
      title: '操作',
      fixed: 'right',
      minWidth: 150,
      slots: { default: 'actions' }
    },
  ],
  data: state.data,
  loading: state.loading,
  pagerConfig: {
    enabled: true,
    currentPage: queryParams.currentPage,
    pageSize: queryParams.pageSize,
    pageSizes: globalTableConfig.pagination.pageSizes,
    total: state.total,
  },
  sortConfig: {
    defaultSort: { field: sortObj.field, order: sortObj.order },
    remote: true,
  },
};

const gridEvents: VxeGridListeners<any> = {
  pageChange: ({ currentPage, pageSize }) => {
    queryParams.currentPage = currentPage;
    queryParams.pageSize = pageSize;
    fetchData();
  },
  sortChange: ({ field, order }) => {
    sortObj.field = field;
    sortObj.order = order;
    fetchData();
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

const router = useRouter();

// 回测开始弹窗状态
const backtestModalVisible = ref(false);

// 打开回测弹窗
const handleStartBacktest = () => {
  backtestModalVisible.value = true;
};

// 回测成功回调
const handleBacktestSuccess = (resultId: string) => {
  message.success('回测启动成功！');
  // 刷新历史数据
  fetchData();
  // 导航到结果页面
  router.push({
    path: '/backtesting/result',
    query: { resultId },
  });
};


const fetchData = async () => {
  state.loading = true;
  updateGridData(); // 更新loading状态
  
  try {
    const response = await getBacktestHistoryApi({
      where: {
        strategyName: queryParams.strategyName,
        symbol: queryParams.symbol,
        interval: queryParams.interval,
      },
      // orderBy: {
      //   [sortObj.field]: sortObj.order,
      // },
      take: queryParams.pageSize,
      skip: (queryParams.currentPage - 1) * queryParams.pageSize,
    });
    state.data = response.data?.data.models || [];
    state.total = response.data?.data.total || 0;
  } catch (error) {
    state.data = [];
    state.total = 0;
  } finally {
    state.loading = false;
    updateGridData(); // 更新数据和loading状态
  }
};

// 查询按钮处理
const handleSearch = () => {
  queryParams.currentPage = 1; // 重置当前页
  fetchData();
};

// 重置按钮处理
const handleReset = () => {
  Object.keys(queryParams).forEach(key => {
    (queryParams as any)[key] = (defaultQuery as any)[key];
  });
  fetchData();
};

// 监听数据变化，更新表格数据
const updateGridData = () => {
  gridApi.setGridOptions({
    data: state.data,
    loading: state.loading,
    pagerConfig: {
      currentPage: queryParams.currentPage,
      pageSize: queryParams.pageSize,
      pageSizes: globalTableConfig.pagination.pageSizes,
      total: state.total,
    },
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
  <Page>
    <!-- 查询表单 -->
    <div class="mb-4 p-4 bg-card rounded">
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
        </Row>
        <Row :gutter="16" class="w-full mt-2">
          <Col class="text-right">
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
      <template #toolbar-tools>
        <Button type="primary" @click="handleStartBacktest">
          开始回测
        </Button>
      </template>
      <template #totalReturnPercent="{ row }">
        <span v-if="row.totalReturnPercent == null || row.totalReturnPercent === ''">--</span>
        <Tag v-else :color="row.totalReturnPercent >= 0 ? 'green' : 'red'">
          {{ (row.totalReturnPercent * 100).toFixed(2) }}%
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

    <!-- 回测开始弹窗 -->
    <BacktestStartModal
      v-model:open="backtestModalVisible"
      @success="handleBacktestSuccess"
    />
  </Page>
</template>
