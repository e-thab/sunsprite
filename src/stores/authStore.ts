import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/assets/utils/supabase";

export const useAuthStore = defineStore('auth', () => {
    const session = ref<Session | null>(null)
    const user = computed<User | null>(() => session.value?.user ?? null)
    const isAuthenticated = computed(() => !!session.value)

    const showSignInModal = ref(false)
    const showSignUpModal = ref(false)
    const displayName = ref<string | null>(null)
    let readyResolve: () => void
    const ready = new Promise<void>((resolve) => { readyResolve = resolve })
    let initialized = false

    function openSignIn() {
        showSignInModal.value = true
    }

    function closeSignIn() {
        showSignInModal.value = false
    }

    function openSignUp() {
        showSignUpModal.value = true
    }

    function closeSignUp() {
        showSignUpModal.value = false
    }

    async function fetchProfile() {
        if (!user.value) {
            displayName.value = null
            return
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.value.id)
            .maybeSingle()

        if (!error) displayName.value = data?.display_name ?? null
    }

    function setDisplayName(name: string | null) {
        displayName.value = name
    }

    async function init() {
        if (initialized) return
        initialized = true

        const { data } = await supabase.auth.getSession()
        session.value = data.session
        await fetchProfile()
        readyResolve()

        supabase.auth.onAuthStateChange((_event, newSession) => {
            session.value = newSession
            fetchProfile()
        })
    }

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        closeSignIn()
    }

    async function signUp(email: string, password: string, displayName?: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: displayName ? { data: { display_name: displayName } } : undefined,
        })
        if (error) throw error
        return { needsEmailConfirmation: !data.session }
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    return {
        session,
        user,
        isAuthenticated,
        showSignInModal,
        showSignUpModal,
        displayName,
        ready,
        openSignIn,
        closeSignIn,
        openSignUp,
        closeSignUp,
        init,
        signIn,
        signUp,
        signOut,
        setDisplayName,
    }
})
