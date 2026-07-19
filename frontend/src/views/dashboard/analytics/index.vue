<script lang="ts" setup>
import { Row, Col, Card, Statistic } from 'ant-design-vue';

defineOptions({ name: 'Analytics' });
</script>

<template>
  <div>
    <h2>数据概览</h2>
    <Row :gutter="16">
      <Col :span="6">
        <Card>
          <Statistic title="总交易次数" :value="0" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="总收益率" :value="0" suffix="%" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="胜率" :value="0" suffix="%" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="最大回撤" :value="0" suffix="%" />
        </Card>
      </Col>
    </Row>
  </div>
</template>
