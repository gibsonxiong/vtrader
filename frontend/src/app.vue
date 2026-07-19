<script lang="ts" setup>
import { ConfigProvider, App as AntApp } from 'ant-design-vue';
import { registerStyles } from 'klinecharts';

registerStyles('custom', {
  candle: {
    type: 'candle_solid',
    bar: {
      upColor: '#F6465D', downColor: '#0ECB81', noChangeColor: '#F6465D',
      upBorderColor: '#F6465D', downBorderColor: '#0ECB81', noChangeBorderColor: '#F6465D',
      upWickColor: '#F6465D', downWickColor: '#0ECB81', noChangeWickColor: '#F6465D',
    },
    priceMark: { last: { upColor: '#F6465D', downColor: '#0ECB81', noChangeColor: '#F6465D' } },
    tooltip: {
      showType: 'rect',
      rect: { position: 'fixed', paddingLeft: 4, paddingRight: 4, paddingTop: 4, paddingBottom: 4, offsetLeft: 10, offsetTop: 10, offsetRight: 10, offsetBottom: 10, borderRadius: 4, borderSize: 1, borderColor: '#f2f3f5', color: '#FEFEFE' },
      legend: { size: 14, marginTop: 6, marginBottom: 6, color: '#666' },
    },
  },
  indicator: { bars: [{ style: 'fill', borderStyle: 'solid', upColor: '#F6465D', downColor: '#0ECB81', noChangeColor: '#F6465D' }] },
});

defineOptions({ name: 'App' });
</script>

<template>
  <ConfigProvider>
    <AntApp>
      <RouterView />
    </AntApp>
  </ConfigProvider>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
body { background: #f5f5f5; -webkit-font-smoothing: antialiased; font-size: 13px; }
/* 全局缩小字体 */
h2 { font-size: 16px !important; }
h3 { font-size: 14px !important; }
/* 移动端表格自适应 */
.ant-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ant-table { min-width: 100%; font-size: 12px; }
.ant-table-cell { padding: 6px 8px !important; }
/* Card 缩小内边距 */
.ant-card-body { padding: 10px 12px !important; }
.ant-card-head { padding: 0 12px !important; min-height: 36px !important; }
.ant-card-head-title { font-size: 14px !important; padding: 8px 0 !important; }
/* Form 缩小间距 */
.ant-form-item { margin-bottom: 10px !important; }
.ant-form-item-label { padding-bottom: 2px !important; }
.ant-form-item-label > label { font-size: 13px !important; }
/* Button 缩小 */
.ant-btn { font-size: 13px !important; }
.ant-btn-sm { font-size: 12px !important; padding: 0 7px !important; height: 26px !important; }
/* Input/Select 缩小 */
.ant-input, .ant-select-selector, .ant-picker { font-size: 13px !important; }
.ant-input-sm, .ant-select-sm .ant-select-selector { font-size: 12px !important; height: 28px !important; }
/* Statistic 缩小 */
.ant-statistic-title { font-size: 12px !important; }
.ant-statistic-content { font-size: 18px !important; }
/* Tag 缩小 */
.ant-tag { font-size: 11px !important; line-height: 18px !important; padding: 0 5px !important; }
/* Modal 缩小 */
.ant-modal-header { padding: 12px 16px !important; }
.ant-modal-body { padding: 12px 16px !important; }
.ant-modal-title { font-size: 15px !important; }
/* 分页缩小 */
.ant-pagination { font-size: 12px !important; }
.ant-pagination-item { min-width: 28px !important; height: 28px !important; line-height: 26px !important; }
</style>
