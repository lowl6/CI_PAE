<template>
  <a-card :title="title" size="small">
    <div>{{ value }}<span style="float:right">{{ unit }}</span></div>
    <div v-if="yoy" style="color:#52c41a">同比 {{ yoy }}%</div>
  </a-card>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  unit: String,
  yoy: [String, Number]
})
</script>