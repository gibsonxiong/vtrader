import { ref } from 'vue'
import { defineStore } from 'pinia'
import { marketDataApi } from '@vtrader/backend/api'
import type { ContractData, BrokerType } from '@vtrader/backend/api'

export const useContractStore = defineStore('contract', () => {
  // 合约数据缓存，key 为 brokerType
  const contractsMap = ref<Map<string, ContractData[]>>(new Map())
  const loading = ref(false)
  const currentBrokerType = ref<string | null>(null)

  // 获取合约列表
  async function fetchContracts(brokerType: BrokerType, forceRefresh = false): Promise<ContractData[]> {
    // 如果已有缓存且不强制刷新，直接返回
    if (!forceRefresh && contractsMap.value.has(brokerType)) {
      return contractsMap.value.get(brokerType) || []
    }

    loading.value = true
    try {
      const res = await marketDataApi.getContracts({ brokerType })
      const contracts = res.data ?? []
      contractsMap.value.set(brokerType, contracts)
      // 触发响应式更新
      contractsMap.value = new Map(contractsMap.value)
      return contracts
    } catch (error) {
      console.error('获取合约列表失败:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 同步合约
  async function syncContracts(brokerType: BrokerType): Promise<number> {
    try {
      const res = await marketDataApi.syncContracts({ brokerType })
      const count = res.data?.count ?? 0
      // 同步后刷新缓存
      await fetchContracts(brokerType, true)
      return count
    } catch (error) {
      console.error('同步合约失败:', error)
      throw error
    }
  }

  // 获取合约数量
  function getContractCount(brokerType: string): number {
    return contractsMap.value.get(brokerType)?.length ?? 0
  }

  // 设置当前查看的 brokerType
  function setCurrentBrokerType(brokerType: string | null) {
    currentBrokerType.value = brokerType
  }

  return {
    contractsMap,
    loading,
    currentBrokerType,
    fetchContracts,
    syncContracts,
    getContractCount,
    setCurrentBrokerType,
  }
})
