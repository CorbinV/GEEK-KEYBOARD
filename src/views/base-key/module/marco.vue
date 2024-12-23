<script setup lang="ts">
import { useRouter } from 'vue-router';
import MacroTemp from '@/views/marco/components/Macro.vue';
import TopBanner from '../components/top-banner.vue';

defineEmits(['key-clicked']);
const router = useRouter();

function handleClick() {
  router.push({
    name: 'marco'
  });
}
</script>

<template>
  <div>
    <TopBanner>
      <template #right-extra>
        <NButton size="large" type="info" ghost class="ml-4" @click="handleClick">跳转编辑</NButton>
      </template>
    </TopBanner>
    <MacroTemp :edit="false" @key-clicked="data => $emit('key-clicked', data)" />
  </div>
</template>
