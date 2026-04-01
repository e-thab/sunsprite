<script setup lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
// import HelloWorld from './components/HelloWorld.vue'
import HomeView from './views/HomeView.vue';
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="wrapper">
    <NavBar class="navbar-header"/>
    <HomeView class="content"/>
    <!-- <div class="content">X</div> -->
    <NavBar class="navbar-footer"/>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* justify-content: space-evenly; */
}
.content {
  background-color: '#222';
  flex: 1 1 100%;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
}
.navbar-header {
  background-color: darkslategray;
  flex: 1;
}
.navbar-footer {
  background-color: darkslategray;
  flex: 1;
}
/* .navbar {
  background-color: darkslategray;
  height: 4vh;
} */
/* header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
} */

/* @media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
} */
</style>
