<template>
  <div>
    <h3 class="text-lg font-semibold mb-3 px-1">Device Library</h3>
    <div v-if="isLoading" class="text-center text-gray-500 py-4">Loading Library...</div>
    <el-alert v-else-if="!library" type="warning" title="No Associated Library" :closable="false" class="mb-3"
      description="This network does not seem to have an associated device library loaded." />
    <div v-else>
      <el-collapse v-model="activeCategories" accordion>
        <el-collapse-item v-for="(templates, category) in categorizedEquipment" :key="category"
          :title="`${category} (${templates!.length})`" :name="category">
          <ul v-if="templates!.length > 0" class="list-none p-0 m-0">
            <li v-for="(template, index) in templates" :key="`${category}-${index}`"
              class="p-2 mb-1 border rounded dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-grab"
              draggable="true" @dragstart="onDragStart(category as EquipmentCategory, template)">
              <span class="font-medium text-sm">{{ template.type_variety || 'Default' }}</span>
              <!-- Maybe show 1-2 key params -->
            </li>
          </ul>
          <div v-else class="text-xs text-gray-400 px-2 py-1">No templates in this category.</div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElCollapse, ElCollapseItem, ElAlert } from 'element-plus';
import type { EquipmentLibraryDetail, EquipmentCategory, EquipmentTemplate } from '~/types/library';

const props = defineProps<{
  library: EquipmentLibraryDetail | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'drag-start', category: EquipmentCategory, template: EquipmentTemplate): void;
}>();

// Get categories present in the library data
const categorizedEquipment = computed(() => {
  if (!props.library) return {};
  const categories: Partial<Record<EquipmentCategory, EquipmentTemplate[]>> = {};
  // Add known categories - API defines Edfa, Fiber, RamanFiber, Roadm, Transceiver
  // Need to check if props.library contains these keys
  if (props.library.Edfa) categories.Edfa = props.library.Edfa;
  if (props.library.Fiber) categories.Fiber = props.library.Fiber;
  if (props.library.RamanFiber) categories.RamanFiber = props.library.RamanFiber;
  if (props.library.Roadm) categories.Roadm = props.library.Roadm;
  if (props.library.Transceiver) categories.Transceiver = props.library.Transceiver;
  // Add checks for other potential categories (Fused, Multiband Amp, etc.) if they are part of the type
  return categories;
});

// Keep track of open category
const activeCategories = ref<string | string[]>([]); // Allow multiple open or single (accordion)

function onDragStart(category: EquipmentCategory, template: EquipmentTemplate) {
  emit('drag-start', category, template);
  // Optional: Add drag image feedback
  // event.dataTransfer.setData('text/plain', JSON.stringify({ category, template }));
}
</script>

<style scoped>
/* Add specific styles for the palette */
</style>
