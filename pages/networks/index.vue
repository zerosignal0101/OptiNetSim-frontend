<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">{{ t('page.networks.title') }}</h1>

    <div class="mb-4 flex justify-between items-center">
      <el-button type="primary" :icon="ElIconPlus" @click="showCreateDialog = true">
        {{ t('page.networks.actions.createNetwork') }}
      </el-button>
      <el-upload action="#" :show-file-list="false" :before-upload="handleImport" accept=".json"
        style="display: inline-block; margin-left: 10px;">
        <el-button type="info" :icon="ElIconUpload">{{ t('page.networks.actions.importNetwork') }}</el-button>
      </el-upload>
    </div>

    <el-table v-loading="isLoading" :data="networkStore.networks" style="width: 100%" border stripe>
      <el-table-column prop="network_name" :label="t('page.networks.network.name')" sortable />
      <el-table-column prop="network_id" :label="t('page.networks.network.id')" width="250" />
      <el-table-column prop="created_at" :label="t('page.networks.network.created')" width="150" sortable :formatter="formatDate" />
      <el-table-column prop="updated_at" :label="t('page.networks.network.updated')" width="150" sortable :formatter="formatDate" />
      <el-table-column :label="t('page.networks.actions.actions')" width="400" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" :icon="ElIconEdit" @click="editNetwork(row.network_id)">
            {{ t('page.networks.actions.edit') }}
          </el-button>
          <el-button type="primary" size="small" :icon="ElIconEdit" @click="editNetworkName(row)">
            {{ t('page.networks.actions.rename') }}
          </el-button>
          <el-button type="success" size="small" :icon="ElIconDownload" @click="exportNetwork(row.network_id)"
            :loading="exporting[row.network_id]">
            {{ t('page.networks.actions.export') }}
          </el-button>
          <el-button type="danger" size="small" :icon="ElIconDelete" @click="confirmDelete(row)">
            {{ t('page.networks.actions.delete') }}
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty :description="t('page.networks.network.noNetworks')" />
      </template>
    </el-table>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showCreateDialog" :title="editTarget ? t('page.networks.network.editTitle') : t('page.networks.network.createTitle')" width="500px"
      @closed="resetForm">
      <el-form ref="networkFormRef" :model="networkForm" :rules="networkFormRules" label-width="120px">
        <el-form-item :label="t('page.networks.network.name')" prop="network_name">
          <el-input v-model="networkForm.network_name" :placeholder="t('page.networks.network.namePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">{{ t('page.networks.actions.cancel') }}</el-button>
          <el-button type="primary" @click="submitNetworkForm" :loading="isSubmitting">
            {{ editTarget ? t('page.networks.actions.saveChanges') : t('page.networks.actions.create') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
import { Plus as ElIconPlus, Upload as ElIconUpload, Edit as ElIconEdit, Download as ElIconDownload, Delete as ElIconDelete } from '@element-plus/icons-vue'
import { useNetworkListStore } from '~/stores/networkList';
import { useNetworkApi } from '~/composables/useNetworkApi';
import type { NetworkListItem } from '~/types/network';
import type { CreateNetworkPayload, UpdateNetworkPayload } from '~/types/api';

// 导入 i18n 工具
const { t, locale, d } = useI18n()
const localePath = useLocalePath()

const networkStore = useNetworkListStore();
const { createNetwork, updateNetwork, deleteNetwork, exportNetwork: apiExportNetwork, importNetwork: apiImportNetwork } = useNetworkApi();

const isLoading = ref(false);
const showCreateDialog = ref(false);
const isSubmitting = ref(false);
const exporting = reactive<Record<string, boolean>>({}); // Track export loading state per network

const networkFormRef = ref<FormInstance>();
const editTarget = ref<NetworkListItem | null>(null); // Store the network being edited
const networkForm = reactive<CreateNetworkPayload | UpdateNetworkPayload>({
  network_name: '',
});

// 国际化表单验证规则
const networkFormRules = reactive<FormRules>({
  network_name: [{ 
    required: true, 
    message: t('validation.networkNameRequired'),
    trigger: 'blur' 
  }],
});

onMounted(async () => {
  isLoading.value = true;
  await networkStore.loadNetworks();
  isLoading.value = false;
});

// 使用 i18n 的日期格式化函数
function formatDate(_row: any, _column: any, cellValue: string) {
  if (!cellValue) return '';
  return d(new Date(cellValue), 'short')
}

function editNetwork(networkId: string) {
  navigateTo(localePath(`/networks/${networkId}/editor`))
}

function editNetworkName(network: NetworkListItem) {
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
            ElMessage.success(t('messages.networkUpdated'));
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
            ElMessage.success(t('messages.networkCreated'));
            showCreateDialog.value = false;
          } else if (error.value) {
            console.error("Create error:", error.value);
            // Error message handled by useApi
          }
        }
      } catch (e) {
        console.error("Form submission error:", e);
        ElMessage.error(t('messages.unexpectedError'));
      } finally {
        isSubmitting.value = false;
      }
    } else {
      ElMessage.error(t('validation.correctErrors'));
    }
  });
}

function confirmDelete(network: NetworkListItem) {
  ElMessageBox.confirm(
    t('messages.deleteNetworkConfirm', { name: network.network_name }),
    t('actions.confirmDeletion'),
    {
      confirmButtonText: t('actions.delete'),
      cancelButtonText: t('actions.cancel'),
      type: 'warning',
    }
  )
    .then(async () => {
      const { data, error } = await deleteNetwork(network.network_id);
      if (data.value || !error.value) { // Check if successful
        networkStore.removeNetworkFromList(network.network_id);
        ElMessage.success(t('messages.networkDeleted'));
      } else {
        // Error handled by useApi
      }
    })
    .catch(() => {
      // User canceled
      ElMessage.info(t('messages.deletionCanceled'));
    });
}

async function exportNetwork(networkId: string) {
  exporting[networkId] = true;
  await apiExportNetwork(networkId); // API composable handles download & messages
  exporting[networkId] = false;
}

async function handleImport(file: UploadRawFile) {
  const loading = ElLoading.service({ 
    text: t('messages.importingNetwork'),
    background: 'rgba(0, 0, 0, 0.7)'
  });
  
  try {
    const { data, error } = await apiImportNetwork(file);
    if (data.value) {
      // Refresh the list
      await networkStore.loadNetworks(); // Force reload
    } else {
      console.error("Import error value:", error.value);
    }
  } catch (e) {
    console.error("Handle import error:", e);
    ElMessage.error(t('messages.importFailed'));
  } finally {
    loading.close();
  }
  return false; // Prevent default upload behavior
}

// 监听语言变化，确保日期格式实时更新
watch(locale, (newLocale) => {
  // 不需要做额外操作，d() 函数会自动响应语言变化
})
</script>
