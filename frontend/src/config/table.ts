/**
 * @description 表格相关的全局配置
 */

// 导出所有配置
export const globalTableConfig = {
  // 分页配置
  pagination: {
    // 默认当前页
    defaultCurrentPage: 1,
    // 默认每页显示数量
    defaultPageSize: 20,
    // 可选的每页显示数量
    pageSizes: [10, 20, 50, 100] as number[],
  },
  // 表格配置
  table: {
    // 默认加载状态
    defaultLoading: false,
  },
} as const;
