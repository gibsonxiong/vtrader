<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '#/store/auth';
import { accessRoutes } from '#/router/routes';
import {
  Layout,
  LayoutHeader,
  LayoutSider,
  LayoutContent,
  Menu,
  Button,
  Dropdown,
  Space,
  theme,
} from 'ant-design-vue';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const collapsed = ref(false);

const selectedKeys = computed(() => {
  const path = route.path;
  return [path];
});

const openKeys = computed(() => {
  const parts = route.path.split('/').filter(Boolean);
  if (parts.length > 1) {
    return ['/' + parts.slice(0, -1).join('/')];
  }
  return [];
});

// Convert routes to menu items
function buildMenuItems(routes: any[]): any[] {
  return routes
    .filter((r) => !r.meta?.hideInMenu)
    .map((r) => ({
      key: r.path,
      icon: r.meta?.icon ? () => null : undefined,
      label: r.meta?.title || r.name,
      children: r.children ? buildMenuItems(r.children) : undefined,
    }));
}

const menuItems = computed(() => {
  // Collect children from the root layout route
  const rootRoute = accessRoutes;
  return buildMenuItems(rootRoute);
});

function handleMenuClick({ key }: { key: string }) {
  router.push(key);
}

async function handleLogout() {
  await authStore.logout();
}
</script>

<template>
  <Layout style="min-height: 100vh">
    <LayoutSider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      theme="dark"
    >
      <div
        style="
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          font-weight: bold;
        "
      >
        <span v-if="!collapsed">VTrader</span>
        <span v-else>VT</span>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        :selected-keys="selectedKeys"
        :default-open-keys="openKeys"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </LayoutSider>

    <Layout>
      <LayoutHeader
        style="
          background: #fff;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <Button
          type="text"
          :icon="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
          @click="collapsed = !collapsed"
        />
        <Space>
          <Dropdown>
            <Space style="cursor: pointer">
              <UserOutlined />
              <span>{{ authStore.accessToken ? '已登录' : '未登录' }}</span>
            </Space>
            <template #overlay>
              <Menu>
                <Menu.Item key="logout" @click="handleLogout">
                  <LogoutOutlined /> 退出登录
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </Space>
      </LayoutHeader>
      <LayoutContent style="margin: 16px; padding: 24px; background: #fff; overflow: auto">
        <RouterView />
      </LayoutContent>
    </Layout>
  </Layout>
</template>
