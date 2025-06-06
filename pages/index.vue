<template>
  <div>
    <h1>Welcome to the homepage in app.vue</h1>
    <nav>
      <ul>
        <li><NuxtLink to="/about">About</NuxtLink></li>
        <li><NuxtLink to="/networktest">V Network Test</NuxtLink></li>
      </ul>
    </nav>
    <TheLogos />
    <TheExamples />
    <AppAlert>
      This is an auto-imported component
    </AppAlert>
  </div>
</template>
