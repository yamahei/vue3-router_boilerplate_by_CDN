// See:
//   Getting Started@Vue Router
//   https://next.router.vuejs.org/guide/

/**
 * Router
 */
//Page Components
const Home = { template: '<div>Home<i class="emoji lion"/></div>' }
const About = { template: '<div>About🐶</div>' }
//Routes
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]
//Router
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})

/**
 * App
 */
const app = Vue.createApp({})
app.use(router)
app.mount('#app')