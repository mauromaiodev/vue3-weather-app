<template>
  <div class="data-div">
    <slot></slot>
  </div>
</template>

<style>
.data-div {
  display: flex;
  flex-direction: column;
  min-width: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  gap: 8px;
}
</style>
