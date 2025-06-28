<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { Form, Input, Button, DatePicker, Select, InputNumber, Modal, Checkbox, message } from 'ant-design-vue';
import { reactive, onMounted, ref } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'vue-router'; // 导入 useRouter
import axios from 'axios';

const router = useRouter(); // 获取 router 实例

const formState = reactive<{
  class_name: string | undefined;
  vt_symbol: string;
  interval: string;
  start: Dayjs | undefined;
  end: Dayjs | undefined;
  rate: number;
  slippage: number;
  size: number;
  pricetick: number;
  capital: number;
}>({
  class_name: undefined,
  vt_symbol: 'SOLUSDT_SWAP.BINANCE',
  interval: '1m',
  start: dayjs('2024-01-01'),
  end: dayjs('2025-06-15'),
  rate: 0.0005,
  slippage: 0.2,
  size: 1.0,
  pricetick: 0.01,
  capital: 100000.0,
});

// 策略参数配置状态
const strategyParamsVisible = ref(false);
const strategyParamsForm = ref<Record<string, any>>({});
const strategyParamsConfig = ref<Record<string, { value: any; type: string }>>({});

// 获取策略参数配置
const fetchStrategyParams = async (strategyName: string) => {
  try {
    const response = await axios.get(`http://127.0.0.1:8000/backtesting/strategy_class/${strategyName}`);
    
    // 检查返回的数据是否为空对象
    if (!response.data || Object.keys(response.data).length === 0) {
      strategyParamsConfig.value = {};
      strategyParamsForm.value = {};
      return;
    }
    
    strategyParamsConfig.value = response.data;
    
    // 初始化表单数据
    const formData: Record<string, any> = {};
    Object.keys(response.data).forEach(key => {
      formData[key] = response.data[key].value;
    });
    strategyParamsForm.value = formData;
  } catch (error) {
    console.error('获取策略参数失败:', error);
    // 如果请求失败，使用默认数据
    strategyParamsConfig.value = {};
    
    const formData: Record<string, any> = {};
    Object.keys(strategyParamsConfig.value).forEach(key => {
      formData[key] = strategyParamsConfig.value[key].value;
    });
    strategyParamsForm.value = formData;
  }
};

const strategyOptions = ref<Array<{ value: string; label: string }>>([]);

// 获取策略列表
const fetchStrategyList = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/backtesting/strategy_class');
    const strategies = response.data;
    strategyOptions.value = strategies.map((strategy: string) => ({
      value: strategy,
      label: strategy,
    }));
    // 设置默认值为第一个策略
    if (strategies.length > 0) {
      formState.class_name = strategies[0];
    }
  } catch (error) {
    console.error('获取策略列表失败:', error);
    // 如果请求失败，使用默认数据
    strategyOptions.value = [];
  }
};

// 组件挂载时获取策略列表
onMounted(() => {
  fetchStrategyList();
});

const klinePeriodOptions = reactive([
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
]);

const onFinish = async (values: any) => {
  console.log('Success:', values);
  // 获取策略参数配置
  if (formState.class_name) {
    await fetchStrategyParams(formState.class_name);
  }
  // 显示策略参数配置弹窗
  strategyParamsVisible.value = true;
};

// 确认策略参数配置
const handleStrategyParamsOk = async () => {
  
  // 准备要传递给结果页面的参数
  const queryParams = {
    ...formState,
    // 格式化日期
    start: formState.start ? formState.start.format('YYYY-MM-DD') : undefined,
    end: formState.end ? formState.end.format('YYYY-MM-DD') : undefined,
    setting: strategyParamsForm.value,
  };

  console.log(queryParams);
  
  try {
    // 发送POST请求到回测接口
    const response = await axios.post('http://127.0.0.1:8000/backtesting/start', queryParams);
    
    // 显示响应结果
    message.success(JSON.stringify(response.data));
    
    // 关闭弹窗
    strategyParamsVisible.value = false;
  } catch (error) {
    // 显示错误信息
    message.error('请求失败: ' + (error.response?.data?.message || error.message));
  }
};

// 取消策略参数配置
const handleStrategyParamsCancel = () => {
  strategyParamsVisible.value = false;
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};
</script>

<template>
  <Page title="开始回测">
    <div class="p-4">
      <Form
        :model="formState"
        name="backtestForm"
        layout="horizontal"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        class="compact-form"
        @finish="onFinish"
        @finishFailed="onFinishFailed"
      >
        <Form.Item
          label="交易策略"
          name="class_name"
          :rules="[{ required: true, message: '请选择交易策略!' }]"
        >
          <Select
            v-model:value="formState.class_name"
            placeholder="请选择策略"
            :options="strategyOptions"
          />
        </Form.Item>

        <Form.Item
          label="本地代码"
          name="vt_symbol"
          :rules="[{ required: true, message: '请输入本地代码!' }]"
        >
          <Input v-model:value="formState.vt_symbol" />
        </Form.Item>

        <Form.Item
          label="K线周期"
          name="interval"
          :rules="[{ required: true, message: '请选择K线周期!' }]"
        >
          <Select
            v-model:value="formState.interval"
            placeholder="请选择K线周期"
            :options="klinePeriodOptions"
          />
        </Form.Item>

        <Form.Item
          label="开始日期"
          name="start"
          :rules="[{ required: true, message: '请选择开始日期!' }]"
        >
          <DatePicker v-model:value="formState.start" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="结束日期"
          name="end"
          :rules="[{ required: true, message: '请选择结束日期!' }]"
        >
          <DatePicker v-model:value="formState.end" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="手续费率"
          name="rate"
          :rules="[{ required: true, message: '请输入手续费率!' }]"
        >
          <InputNumber v-model:value="formState.rate" :step="0.0001" :precision="4" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="交易滑点"
          name="slippage"
          :rules="[{ required: true, message: '请输入交易滑点!' }]"
        >
          <InputNumber v-model:value="formState.slippage" :step="0.1" :precision="1" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="合约乘数"
          name="size"
          :rules="[{ required: true, message: '请输入合约乘数!' }]"
        >
          <InputNumber v-model:value="formState.size" :step="0.1" :precision="1" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="价格跳动"
          name="pricetick"
          :rules="[{ required: true, message: '请输入价格跳动!' }]"
        >
          <InputNumber v-model:value="formState.pricetick" :step="0.01" :precision="2" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="回测资金"
          name="capital"
          :rules="[{ required: true, message: '请输入回测资金!' }]"
        >
          <InputNumber v-model:value="formState.capital" :step="1000" :precision="1" style="width: 100%" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" html-type="submit">开始回测</Button>
        </Form.Item>
      </Form>
    </div>

    <!-- 策略参数配置弹窗 -->
    <Modal
      v-model:open="strategyParamsVisible"
      :title="`策略参数配置: ${formState.class_name || ''}`"
      width="600px"
      @ok="handleStrategyParamsOk"
      @cancel="handleStrategyParamsCancel"
    >
      <!-- 当策略参数为空时显示提示 -->
      <div v-if="Object.keys(strategyParamsConfig).length === 0" class="empty-params-tip">
        <div class="text-center py-8">
          <div class="text-gray-400 text-lg mb-2">📋</div>
          <div class="text-gray-500 mb-2">该策略暂无可配置参数</div>
          <div class="text-gray-400 text-sm">请选择其他策略或联系管理员添加参数配置</div>
        </div>
      </div>
      
      <!-- 当有策略参数时显示表单 -->
      <Form
        v-else
        :model="strategyParamsForm"
        layout="vertical"
        class="strategy-params-form"
      >
        <div class="grid grid-cols-2 gap-4">
          <template v-for="(config, key) in strategyParamsConfig" :key="key">
            <!-- 整数类型 -->
            <Form.Item v-if="config.type === 'int'" :label="`${key} <class '${config.type}'>`">
              <InputNumber 
                v-model:value="strategyParamsForm[key]" 
                style="width: 100%" 
              />
            </Form.Item>
            
            <!-- 浮点数类型 -->
            <Form.Item v-else-if="config.type === 'float'" :label="`${key} <class '${config.type}'>`">
              <InputNumber 
                v-model:value="strategyParamsForm[key]" 
                :step="0.001" 
                :precision="3" 
                style="width: 100%" 
              />
            </Form.Item>
            
            <!-- 布尔类型 -->
            <Form.Item v-else-if="config.type === 'bool'" :label="`${key} <class '${config.type}'>`">
              <Checkbox v-model:checked="strategyParamsForm[key]"></Checkbox>
            </Form.Item>
            
            <!-- 其他类型默认使用输入框 -->
            <Form.Item v-else :label="`${key} <class '${config.type}'>`">
              <Input v-model:value="strategyParamsForm[key]" style="width: 100%" />
            </Form.Item>
          </template>
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.compact-form :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.compact-form :deep(.ant-form-item-label) {
  padding-bottom: 0;
}

.compact-form :deep(.ant-form-item-control) {
  line-height: 1.2;
}
</style>
