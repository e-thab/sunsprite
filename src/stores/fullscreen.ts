import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useFullscreenStore = defineStore('fullscreen', () => {
    const fullscreen = ref(false)

    function toggle() {
        fullscreen.value = !fullscreen.value
        return fullscreen.value
    }

    const largerIcon = '@/src/assets/images/game-icons/larger.png'
    const smallerIcon = '@/src/assets/images/game-icons/smaller.png'

    const icon = computed(() => {
        return fullscreen.value ? smallerIcon : largerIcon
    })

    return { fullscreen, icon, toggle }
})