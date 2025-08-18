<template>
  <main text="gray-800 dark:slate-200" bg="white dark:slate-900" class="py-8">
    <div class="container-01">
      <RouterView />
    </div>
    <TheFooter />
    <div mx-auto mt-5 text-center text-sm opacity-50>
      [Default Layout]
    </div>
    <SnackbarContainer />
  </main>
</template>
