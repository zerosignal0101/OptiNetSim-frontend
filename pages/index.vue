<template>
  <div class="text-center py-10">
    <h1 class="text-3xl font-bold mb-4">Welcome to OptiNetSim</h1>
    <p class="mb-6">Optical Network Simulator Frontend</p>
    <el-button type="primary" size="large" @click="goToNetworks">
      Manage Networks
    </el-button>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
function goToNetworks() {
  router.push('/networks');
}
// Redirect immediately if preferred
// await navigateTo('/networks');
</script>
