<template>
  <main class="py-8">
    <div text="gray-100 dark:gray-10" bg="white dark:gray-100">
      <RouterView />
    </div>
    <TheFooter />
    <div mx-auto mt-5 text-center text-sm opacity-50>
      [Default Layout]
    </div>
    <SnackbarContainer />
  </main>
</template>
