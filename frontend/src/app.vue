<script lang="ts" setup>
import { ConfigProvider, App as AntApp } from 'ant-design-vue';
import { antdLocale } from './locales';
import { registerStyles } from 'klinecharts';

registerStyles('custom', {
  candle: {
    type: 'candle_solid',
    bar: {
      upColor: '#F6465D',
      downColor: '#0ECB81',
      noChangeColor: '#F6465D',
      upBorderColor: '#F6465D',
      downBorderColor: '#0ECB81',
      noChangeBorderColor: '#F6465D',
      upWickColor: '#F6465D',
      downWickColor: '#0ECB81',
      noChangeWickColor: '#F6465D',
    },
    priceMark: {
      last: {
        upColor: '#F6465D',
        downColor: '#0ECB81',
        noChangeColor: '#F6465D',
      },
    },
    tooltip: {
      showType: 'rect',
      rect: {
        position: 'fixed',
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        offsetLeft: 10,
        offsetTop: 10,
        offsetRight: 10,
        offsetBottom: 10,
        borderRadius: 4,
        borderSize: 1,
        borderColor: '#f2f3f5',
        color: '#FEFEFE',
      },
      legend: {
        size: 14,
        marginTop: 6,
        marginBottom: 6,
        color: '#666',
      },
    },
  },
  indicator: {
    bars: [
      {
        style: 'fill',
        borderStyle: 'solid',
        upColor: '#F6465D',
        downColor: '#0ECB81',
        noChangeColor: '#F6465D',
      },
    ],
  },
});

defineOptions({ name: 'App' });
</script>

<template>
  <ConfigProvider :locale="antdLocale">
    <AntApp>
      <RouterView />
    </AntApp>
  </ConfigProvider>
</template>
