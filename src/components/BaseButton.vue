<template>
  <button class="button">
    <slot></slot>
  </button>
</template>

<style>
.button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.button:hover {
  background-color: #45a049;
}
</style>
