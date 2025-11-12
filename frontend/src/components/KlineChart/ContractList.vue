<script lang="ts" setup>
import { Loading } from '@vtrader/common-ui';
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getContractsApi, type MarketDataApi } from '#/api';

type ContractData = MarketDataApi.ContractData;

interface Props {
  selectedSymbol?: string;
}

const props = withDefaults(defineProps<Props>(), {
  selectedSymbol: '',
});

const emit = defineEmits<{
  contractSelected: [contract: ContractData];
}>();

const contracts = ref<ContractData[]>([]);
const contractsLoading = ref(false);

// 获取合约列表
async function fetchContracts() {
  try {
    contractsLoading.value = true;
    const { data } = await getContractsApi();
    contracts.value = data || [];
  } catch (err: any) {
    message.error('获取合约失败：' + (err?.response?.data?.message || err?.message || '未知错误'));
    contracts.value = [];
  } finally {
    contractsLoading.value = false;
  }
}

// 选择合约
function selectContract(contract: ContractData) {
  if (!contract?.symbol) return;
  emit('contractSelected', contract);
}

onMounted(() => {
  fetchContracts();
});

defineExpose({
  fetchContracts,
});
</script>

<template>
  <div class="contract-list">
    <Loading :spinning="contractsLoading">
      <div class="contract-search">
        <input
          type="text"
          placeholder="搜索合约..."
          class="search-input"
        />
      </div>
      <ul class="contract-ul">
        <li
          v-for="contract in contracts"
          :key="contract.symbol"
          class="contract-item"
          :class="{ active: contract.symbol === props.selectedSymbol }"
          :title="contract.symbol"
          @click="selectContract(contract)"
        >
          <div class="contract-info">
            <div class="contract-name">{{ contract.name }}</div>
            <div class="contract-symbol">{{ contract.symbol }}</div>
          </div>
        </li>
      </ul>
    </Loading>
  </div>
</template>

<style scoped lang="less">
.contract-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.contract-search {
  padding: 12px 0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #1890ff;
}

.contract-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  max-height: 500px;

}

.contract-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:first-child {
    border-top: 1px solid #e8e8e8;
  }
}

.contract-item:hover {
  background-color: #f5f7fa;
}

.contract-item.active {
  background-color: #1890ff;
  color: white;
}

.contract-item.active:hover {
  background-color: #40a9ff;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contract-name {
  font-weight: 500;
  font-size: 14px;
}

.contract-symbol {
  font-size: 12px;
  opacity: 0.7;
}

.contract-item.active .contract-symbol {
  opacity: 0.9;
}
</style>
