<template>
  <button class="remove-button">
    <slot></slot>
  </button>
</template>

<style>
.remove-button {
  background-color: #ff3333;
  color: #fff;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.remove-button:hover {
  background-color: #cc0000;
}
</style>
