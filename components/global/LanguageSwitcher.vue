<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    :hide-on-click="true"
    @visible-change="handleDropdownChange"
  >
    <el-button
      plain
      class="locale-switcher-button"
      :class="{ 'locale-switcher-open': dropdownVisible }"
    >
      <div class="flex items-center">
        <span class="mr-1">{{ currentLocale.name }}</span>
        <el-icon :class="{ 'rotate-180': dropdownVisible }">
          <arrow-down />
        </el-icon>
      </div>
    </el-button>
    
    <template #dropdown>
      <el-dropdown-menu class="locale-dropdown-menu">
        <el-dropdown-item
          v-for="locale in availableLocales"
          :key="locale.code"
          :class="{ 'active-locale': locale.code === currentLocaleCode }"
        >
          <NuxtLink
            :to="switchLocalePath(locale.code)"
            class="locale-item-link"
            @click="closeDropdown"
          >
            <div class="locale-item">
              <span>{{ locale.name }}</span>
              <el-icon v-if="locale.code === currentLocaleCode" class="check-icon">
                <check />
              </el-icon>
            </div>
          </NuxtLink>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ArrowDown, Check } from '@element-plus/icons-vue';

// useI18n() 返回当前语言环境、可用语言列表等
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const dropdownVisible = ref(false);

// 获取当前语言的 code
const currentLocaleCode = computed(() => locale.value);

// 获取当前语言的完整对象
const currentLocale = computed(() => {
  return locales.value.find(l => l.code === locale.value) || { name: 'Language', code: 'en' };
});

// 获取所有可用语言
const availableLocales = computed(() => {
  return locales.value;
});

const handleDropdownChange = (visible: boolean) => {
  dropdownVisible.value = visible;
};

const closeDropdown = () => {
  dropdownVisible.value = false;
};
</script>

<style scoped>

</style>
