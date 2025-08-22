<script setup lang="ts">
/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Component, PropType } from 'vue'
import { computed } from 'vue'

export interface LinkProps {
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean
  'className'?: string
  'disabled'?: boolean
  'href'?: string
  'inline'?: boolean
  'renderIcon'?: Component | string
  'size'?: 'sm' | 'md' | 'lg'
  'target'?: '_self' | '_blank' | '_parent' | '_top'
  'visited'?: boolean
}

const props = defineProps({
  as: {
    type: [String, Object] as PropType<string | Component>,
    default: 'a',
  },
  ariaCurrent: {
    type: [String, Boolean] as PropType<LinkProps['aria-current']>,
    default: undefined,
  },
  className: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  href: {
    type: String,
    default: undefined,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  renderIcon: {
    type: [Object, Function, String] as PropType<LinkProps['renderIcon']>,
    default: undefined,
  },
  size: {
    type: String as PropType<LinkProps['size']>,
    default: 'md',
  },
  target: {
    type: String as PropType<LinkProps['target']>,
    default: undefined,
  },
  visited: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const baseComponent = computed(() => props.as)

const relAttribute = computed(() => {
  return props.target === '_blank' ? 'noopener noreferrer' : undefined
})

const linkAttributes = computed(() => {
  const attrs: Record<string, any> = {
    'class': [
      props.className,
      'cds-link',
      {
        'cds-link--inline': props.inline,
        'cds-link--disabled': props.disabled,
        'cds-link--visited': props.visited,
      },
      `cds-link--${props.size}`,
    ],
    'rel': relAttribute.value,
    'target': props.target,
    'aria-current': props.ariaCurrent,
  }

  if (!props.disabled) {
    attrs.href = props.href
  }
  else {
    attrs.role = 'link'
    attrs['aria-disabled'] = true
  }
  return attrs
})

function handleClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    event.stopPropagation()
  }
  emit('click', event)
}
</script>

<template>
  <component :is="baseComponent" v-bind="linkAttributes" @click="handleClick">
    <slot />
    <!-- Render icon only if not inline and `renderIcon` prop is provided -->
    <div v-if="!inline && renderIcon" class="cds-link__icon">
      <!-- <-- 添加 `cds-link__icon` 类名 -->
      <component :is="renderIcon" v-if="typeof renderIcon !== 'string'" />
      <div v-else :class="renderIcon" />
    </div>
  </component>
</template>

<style scoped>
/*
 * 在此 <style scoped> 块中，使用 @apply 语法。
 * PostCSS JIT 转换将这些 @apply 指令替换为实际的 CSS 属性。
 * Vue 的 scoped 样式机制将为这些类名添加唯一的哈希（例如：.cds-link[data-v-xxxxxx]），
 * 从而实现样式隔离，防止与外部同名类冲突。
 */

/* =========================================================================
   Base Link Styles (对应 cds-link 快捷方式)
   ========================================================================= */
.cds-link {
  @apply text-blue-60 hover:text-blue-70 focus:outline-[2px] focus:outline-offset-2px focus:outline-blue-70
         relative inline-flex items-center
         after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1px after:bg-current after:opacity-100
         transition-opacity motion-productive-standard-fast-01
         body01 dark:text-blue-40 dark:hover:text-blue-30 dark:focus:outline-blue-30;
}

/* =========================================================================
   Modifier Variants (对应 cds-link--inline, cds-link--disabled, etc. 快捷方式)
   使用选择器优先级覆盖基础样式
   ========================================================================= */

/* Inline link */
.cds-link--inline {
  @apply inline after:opacity-0 hover:after:opacity-100 focus:after:opacity-100;
}

/* Disabled link */
.cds-link--disabled {
  @apply text-gray-50 cursor-not-allowed pointer-events-none after:opacity-0 !no-underline dark:text-gray-70;
}

/* Visited link */
.cds-link--visited {
  @apply text-purple-60 dark:text-purple-30;
}

/* =========================================================================
   Size Variants (对应 cds-link--sm, cds-link--md, cds-link--lg 快捷方式)
   ========================================================================= */

.cds-link--sm {
  @apply caption01;
}

.cds-link--md {
  @apply body01; /* 默认 size，也是基础 cds-link 的默认排版 */
}

.cds-link--lg {
  @apply body02;
}

/* =========================================================================
   Internal Elements (对应 cds-link__icon 快捷方式)
   ========================================================================= */
.cds-link__icon {
  @apply ml-3 flex items-center shrink-0;
}
</style>
