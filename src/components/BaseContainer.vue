<template>
  <div class="container">
    <slot></slot>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}
</style>
