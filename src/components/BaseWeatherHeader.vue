<template>
  <div class="weather-header">
    <slot></slot>
  </div>
</template>

<style>
.weather-header {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: space-evenly;
}
</style>
