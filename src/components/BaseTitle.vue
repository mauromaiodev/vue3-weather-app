<template>
  <div class="title">
    {{ title }}
  </div>
</template>

<script setup lang="ts">
defineProps(['title'])
</script>

<style>
.title {
  display: flex;
  flex-direction: column;
  font-size: 20px;
}
</style>
