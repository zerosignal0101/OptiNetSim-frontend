<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Optical Networks</h1>

    <div class="mb-4 flex justify-between items-center">
      <el-button type="primary" :icon="ElIconPlus" @click="showCreateDialog = true">
        Create Network
      </el-button>
      <el-upload action="#" :show-file-list="false" :before-upload="handleImport" accept=".json"
        style="display: inline-block; margin-left: 10px;">
        <el-button type="info" :icon="ElIconUpload">Import Network</el-button>
      </el-upload>
    </div>

    <el-table v-loading="isLoading" :data="networkStore.networks" style="width: 100%" border stripe>
      <el-table-column prop="network_name" label="Name" sortable />
      <el-table-column prop="network_id" label="ID" width="250" />
      <el-table-column prop="created_at" label="Created" width="200" sortable :formatter="formatDate" />
      <el-table-column prop="updated_at" label="Updated" width="200" sortable :formatter="formatDate" />
      <el-table-column label="Actions" width="250" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" :icon="ElIconEdit" @click="editNetwork(row)">
            Edit
          </el-button>
          <el-button type="success" size="small" :icon="ElIconDownload" @click="exportNetwork(row.network_id)"
            :loading="exporting[row.network_id]">
            Export
          </el-button>
          <el-button type="danger" size="small" :icon="ElIconDelete" @click="confirmDelete(row)">
            Delete
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="No networks found. Create one!" />
      </template>
    </el-table>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showCreateDialog" :title="editTarget ? 'Edit Network' : 'Create New Network'" width="500px"
      @closed="resetForm">
      <el-form ref="networkFormRef" :model="networkForm" :rules="networkFormRules" label-width="120px">
        <el-form-item label="Network Name" prop="network_name">
          <el-input v-model="networkForm.network_name" placeholder="Enter network name" />
        </el-form-item>
        <!-- Add field for selecting associated library if required during creation -->
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">Cancel</el-button>
          <el-button type="primary" @click="submitNetworkForm" :loading="isSubmitting">
            {{ editTarget ? 'Save Changes' : 'Create' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
import { useNetworkListStore } from '~/stores/networkList';
import { useNetworkApi } from '~/composables/useNetworkApi';
import type { NetworkListItem } from '~/types/network';
import type { CreateNetworkPayload, UpdateNetworkPayload } from '~/types/api';

// 1. 导入 Element Plus 的语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'


const networkStore = useNetworkListStore();
const { createNetwork, updateNetwork, deleteNetwork, exportNetwork: apiExportNetwork, importNetwork: apiImportNetwork } = useNetworkApi();
const router = useRouter();

const isLoading = ref(false);
const showCreateDialog = ref(false);
const isSubmitting = ref(false);
const exporting = reactive<Record<string, boolean>>({}); // Track export loading state per network

const networkFormRef = ref<FormInstance>();
const editTarget = ref<NetworkListItem | null>(null); // Store the network being edited
const networkForm = reactive<CreateNetworkPayload | UpdateNetworkPayload>({
  network_name: '',
});
const networkFormRules = reactive<FormRules>({
  network_name: [{ required: true, message: 'Please enter a network name', trigger: 'blur' }],
});

onMounted(async () => {
  isLoading.value = true;
  await networkStore.loadNetworks();
  isLoading.value = false;
});

function formatDate(row: any, column: any, cellValue: string) {
  if (!cellValue) return '';
  return new Date(cellValue).toLocaleString();
}

function editNetwork(network: NetworkListItem) {
  editTarget.value = network;
  networkForm.network_name = network.network_name;
  showCreateDialog.value = true;
}

function resetForm() {
  editTarget.value = null;
  networkForm.network_name = '';
  networkFormRef.value?.resetFields();
}

async function submitNetworkForm() {
  if (!networkFormRef.value) return;
  await networkFormRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        if (editTarget.value) {
          // Update existing network
          const { data, error } = await updateNetwork(editTarget.value.network_id, { network_name: networkForm.network_name });
          if (data.value) {
            networkStore.updateNetworkInList(data.value);
            ElMessage.success('Network updated successfully!');
            showCreateDialog.value = false;
          } else if (error.value) {
            console.error("Update error:", error.value);
            // Error message handled by useApi
          }
        } else {
          // Create new network
          const { data, error } = await createNetwork({ network_name: networkForm.network_name });
          if (data.value) {
            networkStore.addNetworkToList(data.value);
            ElMessage.success('Network created successfully!');
            showCreateDialog.value = false;
          } else if (error.value) {
            console.error("Create error:", error.value);
            // Error message handled by useApi
          }
        }
      } catch (e) {
        console.error("Form submission error:", e);
        ElMessage.error('An unexpected error occurred.');
      } finally {
        isSubmitting.value = false;
      }
    } else {
      ElMessage.error('Please correct the errors in the form.');
    }
  });
}

function confirmDelete(network: NetworkListItem) {
  ElMessageBox.confirm(
    `Are you sure you want to delete the network "${network.network_name}"? This action cannot be undone.`,
    'Confirm Deletion',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      const { data, error } = await deleteNetwork(network.network_id);
      if (data.value || !error.value) { // Check if successful
        networkStore.removeNetworkFromList(network.network_id);
        ElMessage.success('Network deleted successfully.');
      } else {
        // Error handled by useApi
      }
    })
    .catch(() => {
      // User canceled
      ElMessage.info('Deletion canceled.');
    });
}

async function exportNetwork(networkId: string) {
  exporting[networkId] = true;
  await apiExportNetwork(networkId); // API composable handles download & messages
  exporting[networkId] = false;
}

async function handleImport(file: UploadRawFile) {
  console.log("Importing file:", file.name);
  // Show loading state
  const loading = ElLoading.service({ text: 'Importing network...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    const { data, error } = await apiImportNetwork(file);
    if (data.value) {
      // ElMessage.success(`Network "${data.value.network_name}" imported successfully!`);
      // Refresh the list
      await networkStore.loadNetworks(); // Force reload
    } else {
      // Error handled by composable/plugin
      console.error("Import error value:", error.value);
    }
  } catch (e) {
    console.error("Handle import error:", e);
    ElMessage.error('Failed to start import process.');
  } finally {
    loading.close();
  }
  return false; // Prevent default upload behavior
}

// Navigate to editor page
watch(editTarget, (newVal) => {
  if (newVal && !showCreateDialog.value) { // If edit was triggered but dialog not shown (e.g., direct button)
    router.push(`/networks/${newVal.network_id}/editor`);
  }
})

// Go to editor when clicking Edit button (alternative to row click)
// function goToEditor(networkId: string) {
//     router.push(`/networks/${networkId}/editor`);
// }

// 2. 获取 @nuxtjs/i18n 的响应式 locale
const { locale, t } = useI18n()

// 3. 创建一个计算属性，用于根据 i18n 的 locale 动态返回对应的 Element Plus 语言包
const elementPlusLocale = computed(() => {
  // 这里的 locale.value 就是你在 nuxt.config.ts 中定义的 `locales` 数组里的 `code`
  switch (locale.value) {
    case 'en':
      console.log("Element plus change to EN.");
      return en
    case 'zh':
      console.log("Element plus change to ZH.");
      return zhCn
    default:
      // 提供一个默认回退
      return zhCn
  }
})

</script>

<style scoped>
/* Add custom styles if needed */
</style>
