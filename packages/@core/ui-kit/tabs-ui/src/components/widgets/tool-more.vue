<script lang="ts" setup>
import type { DropdownMenuProps } from '@vtrader-core/shadcn-ui';

import { ChevronDown } from '@vtrader-core/icons';
import { VbenDropdownMenu } from '@vtrader-core/shadcn-ui';

defineProps<DropdownMenuProps>();
</script>

<template>
  <VbenDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center hover:bg-muted hover:text-foreground text-muted-foreground border-border h-full cursor-pointer border-l px-2 text-lg font-semibold"
    >
      <ChevronDown class="size-4" />
    </div>
  </VbenDropdownMenu>
</template>
