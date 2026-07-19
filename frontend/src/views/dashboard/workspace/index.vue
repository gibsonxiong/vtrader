<script lang="ts" setup>
import { Card, Row, Col } from 'ant-design-vue';
defineOptions({ name: 'Workspace' });
</script>

<template>
  <div>
    <h2>工作台</h2>
    <Row :gutter="16">
      <Col :span="8">
        <Card title="回测">
          <router-link to="/backtesting/history">查看回测历史</router-link>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="行情数据">
          <router-link to="/market-data/overview">查看数据大纲</router-link>
        </Card>
      </Col>
      <Col :span="8">
        <Card title="WebSocket 测试">
          <router-link to="/ws-test">WebSocket 测试</router-link>
        </Card>
      </Col>
    </Row>
  </div>
</template>
