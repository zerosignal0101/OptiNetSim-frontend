<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <div class="flex-col-center py-8">
    <div text-4xl>
      <div i-carbon-pedestrian inline-block />
    </div>

    <p text-sm opacity-75>
      <em> Editor default page. </em>
    </p>

    <div>
      <button
        m="3 t6" text-sm btn-ghost
        @click="router.back()"
      >
        Back
      </button>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
