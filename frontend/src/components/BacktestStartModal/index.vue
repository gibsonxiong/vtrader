<script lang="ts" setup>
import { Form, Input, Button, DatePicker, Select, InputNumber, Modal, Checkbox, message, Tag } from 'ant-design-vue';
import { reactive, onMounted, ref, watch } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'vue-router';
import type { BacktestingSetting } from '@vtrader/shared';
import { Interval } from '@vtrader/shared';
import { getStrategyClassesApi, getStrategyClassByNameApi, createBacktestApi } from '#/api';

interface Props {
  open: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success', resultId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();

// 修改：表单状态使用 Dayjs 对象用于 DatePicker 绑定
const formState = reactive({
  strategyName: '',
  symbols: ['BTCUSDT:USDT'],
  interval: Interval.MINUTE_1,
  startDate: dayjs().subtract(4, 'day'),
  endDate: dayjs().add(1, 'd'),
  commissionRate: 0.0005,
  balance: 100_000,
});

// 新增：转换表单数据为 API 格式
function convertFormStateToApiFormat(): BacktestingSetting {
  return {
    strategy: {
      strategyName: formState.strategyName,
      strategySetting: strategyParamsForm.value,
    },
    symbols: formState.symbols,
    interval: formState.interval,
    startDate: formState.startDate.format('YYYY-MM-DD'),
    endDate: formState.endDate.format('YYYY-MM-DD'),
    commissionRate: formState.commissionRate,
    balance: formState.balance,
  };
}

// 策略参数配置状态
const strategyParamsVisible = ref(false);
const strategyParamsForm = ref<Record<string, any>>({});
const strategyParamsConfig = ref<Record<string, { value: any; type: string }>>({});

// 记住参数功能
const rememberParams = ref(true);
const isUsingCache = ref(false); // 标记是否使用了缓存

// localStorage 操作函数
const getStorageKey = (strategyName: string) => `backtest_params_${strategyName}`;

const saveParamsToStorage = (strategyName: string, params: Record<string, any>) => {
  try {
    const key = getStorageKey(strategyName);
    localStorage.setItem(key, JSON.stringify(params));
  } catch (error) {
    console.error('保存参数到 localStorage 失败:', error);
  }
};

const loadParamsFromStorage = (strategyName: string): Record<string, any> | null => {
  try {
    const key = getStorageKey(strategyName);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('从 localStorage 加载参数失败:', error);
    return null;
  }
};

// 清除缓存并重置参数
const clearCacheAndReset = () => {
  if (!formState.strategyName) {
    return;
  }
  
  // 清除localStorage中的缓存
  try {
    const key = getStorageKey(formState.strategyName);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
  
  // 重置为默认参数
  if (!strategyParamsConfig.value || Object.keys(strategyParamsConfig.value).length === 0) {
    return;
  }
  
  const defaultFormData: Record<string, any> = {};
  Object.keys(strategyParamsConfig.value).forEach(key => {
    defaultFormData[key] = strategyParamsConfig.value[key].value;
  });
  
  strategyParamsForm.value = defaultFormData;
  
  // 更新缓存状态
  isUsingCache.value = false;
  
  message.success('缓存已清除');
};

// 获取策略参数配置
const fetchStrategyParams = async (strategyName: string) => {
  try {
    const {data} = await getStrategyClassByNameApi(strategyName);
    
    // 检查返回的数据是否为空对象
    if (!data || Object.keys(data).length === 0) {
      strategyParamsConfig.value = {};
      strategyParamsForm.value = {};
      return;
    }
    
    strategyParamsConfig.value = data;
    
    // 初始化表单数据
    const formData: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      formData[key] = data[key].value;
    });
    
    // 尝试加载保存的参数
    const savedParams = loadParamsFromStorage(strategyName);
    if (savedParams) {
      // 合并保存的参数，只覆盖存在的字段
      Object.keys(savedParams).forEach(key => {
        if (key in formData) {
          formData[key] = savedParams[key];
        }
      });
      isUsingCache.value = true; // 标记使用了缓存
    } else {
      isUsingCache.value = false; // 没有使用缓存
    }
    
    strategyParamsForm.value = formData;
  } catch (error: any) {
    console.error('获取策略参数失败:', error);
    // 如果请求失败，使用默认数据
    strategyParamsConfig.value = {};
    
    const formData: Record<string, any> = {};
    Object.keys(strategyParamsConfig.value).forEach(key => {
      formData[key] = strategyParamsConfig.value[key]?.value;
    });
    strategyParamsForm.value = formData;
    // 错误时没有使用缓存
    isUsingCache.value = false;
  }
};

const strategyOptions = ref<Array<{ value: string; label: string }>>([]);

// 获取策略列表
const fetchStrategyList = async () => {
  try {
    const {data: strategies} = await getStrategyClassesApi();
    strategyOptions.value = strategies.map((strategy: string) => ({
      value: strategy,
      label: strategy,
    }));
    // 设置默认值为第一个策略
    if (strategies[0]) {
      formState.strategyName = strategies[0];
    }
  } catch (error: any) {
    console.error('获取策略列表失败:', error);
    // 如果请求失败，使用默认数据
    strategyOptions.value = [];
  }
};

// 监听弹窗打开状态，初始化数据
watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchStrategyList();
  }
});

const klinePeriodOptions = reactive([
  { value: Interval.MINUTE_1, label: '1m' },
  { value: Interval.MINUTE_5, label: '5m' },
  { value: Interval.MINUTE_15, label: '15m' },
  { value: Interval.HOUR_1, label: '1h' },
  { value: Interval.HOUR_4, label: '4h' },
  { value: Interval.DAILY_1, label: '1d' },
]);

// 确认策略参数配置
const handleStrategyParamsOk = async () => {
  // 如果勾选了记住参数，保存到 localStorage
  if (rememberParams.value && formState.strategyName) {
    saveParamsToStorage(formState.strategyName, strategyParamsForm.value);
    message.success('参数已保存，下次打开将自动使用');
  }
  
  // 修改：使用转换函数准备 API 参数
  const queryParams = convertFormStateToApiFormat();

  console.log(queryParams);
  
  try {
    // 发送POST请求到回测接口
    const response = await createBacktestApi(queryParams);
    
    strategyParamsVisible.value = false;

    console.log(response.data)

    // 提取回测结果ID
    const resultId = String(response.data?.data?.id ?? '');
    if (resultId) {
      // 关闭主弹窗
      emit('update:open', false);
      // 触发成功事件，传递结果ID
      emit('success', resultId);
    } else {
      message.error('回测结果ID不存在');
    }
    
  } catch (error: any) {
    // 显示错误信息
    const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
    message.error('请求失败: ' + errorMessage);
  }
};

// 取消策略参数配置
const handleStrategyParamsCancel = () => {
  strategyParamsVisible.value = false;
};

const onFinish = async (values: any) => {
  console.log('Success:', values);
  // 获取策略参数配置
  if (formState.strategyName) {
    await fetchStrategyParams(formState.strategyName);
  }
  // 显示策略参数配置弹窗
  strategyParamsVisible.value = true;
};

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};

// 关闭主弹窗
const handleCancel = () => {
  emit('update:open', false);
};
</script>

<template>
  <Modal
    :open="props.open"
    title="开始回测"
    width="800px"
    :footer="null"
    @cancel="handleCancel"
  >
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
          name="strategyName"
          :rules="[{ required: true, message: '请选择交易策略!' }]"
        >
          <Select
            v-model:value="formState.strategyName"
            placeholder="请选择策略"
            :options="strategyOptions"
          />
        </Form.Item>

        <Form.Item
          label="标的代码"
          name="symbols"
          :rules="[{ required: true, message: '请输入标的代码!' }]"
        >
          <Select
            v-model:value="formState.symbols"
            mode="tags"
            style="width: 100%"
            :token-separators="[',', '，', ';', '、', ' ']"
            allow-clear
            placeholder="输入后按回车，或用逗号/空格分隔多个标的"
          />
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
          name="startDate"
          :rules="[{ required: true, message: '请选择开始日期!' }]"
        >
          <DatePicker v-model:value="formState.startDate" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="结束日期"
          name="endDate"
          :rules="[{ required: true, message: '请选择结束日期!' }]"
        >
          <DatePicker v-model:value="formState.endDate" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="手续费率"
          name="commissionRate"
          :rules="[{ required: true, message: '请输入手续费率!' }]"
        >
          <InputNumber v-model:value="formState.commissionRate" :step="0.0001" :precision="4" style="width: 100%" />
        </Form.Item>

        <Form.Item
          label="回测资金"
          name="balance"
          :rules="[{ required: true, message: '请输入回测资金!' }]"
        >
          <InputNumber v-model:value="formState.balance" :step="1000" :precision="1" style="width: 100%" />
        </Form.Item>

        <Form.Item class="text-center">
          <Button type="primary" html-type="submit">开始回测</Button>
          <Button @click="handleCancel" class="ml-2">取消</Button>
        </Form.Item>
      </Form>
    </div>

    <!-- 策略参数配置弹窗 -->
    <Modal
      v-model:open="strategyParamsVisible"
      width="600px"
      @ok="handleStrategyParamsOk"
      @cancel="handleStrategyParamsCancel"
    >
      <template #title>
        <div class="flex items-center">
          <span>策略参数配置: {{ formState.strategyName }}</span>
          <div v-if="isUsingCache" class="flex items-center ml-2">
            <Tag 
              color="blue" 
              closable 
              @close="clearCacheAndReset"
            >
              已加载缓存
            </Tag>
          </div>
        </div>
      </template>
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
        :label-wrap="false"
        :label-col="{ span: 10 }"
        :wrapper-col="{ span: 14 }"
        class="strategy-params-form"
      >
        <div>
          <template v-for="(config, key) in strategyParamsConfig" :key="key">
            <!-- 整数类型 -->
            <Form.Item>
              <template v-slot:label>
                <Tag color="blue">{{config.type}}</Tag>
                <span>{{key}}</span>
              </template>
              <InputNumber 
                v-if="config.type === 'number'"
                v-model:value="strategyParamsForm[key]" 
                style="width: 100%" 
              />
              <Checkbox v-else-if="config.type === 'boolean'" v-model:checked="strategyParamsForm[key]"></Checkbox>
              <Input v-else v-model:value="strategyParamsForm[key]" style="width: 100%" />
            </Form.Item>
          </template>
        </div>
        
        <!-- 记住参数选项和重置按钮 -->
        <div class="remember-params-section">
          <Form.Item :wrapper-col="{ span: 24 }">
            <div class="params-actions">
              <Checkbox v-model:checked="rememberParams">
                记住参数
              </Checkbox>
            </div>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </Modal>
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

.remember-params-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.remember-params-section :deep(.ant-form-item) {
  margin-bottom: 0;
}

.remember-params-section :deep(.ant-checkbox-wrapper) {
  color: #666;
  font-size: 13px;
}

.params-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.params-actions :deep(.ant-btn) {
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
}

/* 弹窗标题样式 */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 8px;
}

.text-red-500 {
  color: #ef4444;
}

.text-red-500:hover {
  color: #dc2626;
}
</style>
