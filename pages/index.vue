<script setup lang="ts">
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="m-4 space-y-8">
      <h1 class="text-4xl text-center font-bold">真理</h1>
      <div class="flex gap-8">
        <ULink class="px-4 py-2 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg transition" to="/simulator">真理模拟器</ULink>
        <ULink class="px-4 py-2 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg transition" to="/outer-calculator">外场计算器</ULink>
      </div>
      <FooterCredit class="text-center"/>
    </div>
  </div>
</template>

<style lang="postcss" scoped>

</style>