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
    const username = ref<string | null>(null)
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
            username.value = null
            return
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.value.id)
            .maybeSingle()

        if (!error) username.value = data?.username ?? null
    }

    function setUsername(name: string | null) {
        username.value = name
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

    async function signIn(identifier: string, password: string) {
        let email = identifier.trim()

        if (!email.includes('@')) {
            const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_for_username', {
                lookup_username: email.toLowerCase(),
            })
            if (lookupError) throw lookupError
            if (!resolvedEmail) throw new Error('Invalid login credentials')
            email = resolvedEmail
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        closeSignIn()
    }

    async function signUp(email: string, password: string, username?: string) {
        const metadata: Record<string, string> = {}
        if (username) metadata.username = username

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: Object.keys(metadata).length ? { data: metadata } : undefined,
        })
        if (error) throw error
        return { needsEmailConfirmation: !data.session }
    }

    async function updateEmail(newEmail: string) {
        const { error } = await supabase.auth.updateUser({ email: newEmail })
        if (error) throw error
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
        username,
        ready,
        openSignIn,
        closeSignIn,
        openSignUp,
        closeSignUp,
        init,
        signIn,
        signUp,
        updateEmail,
        signOut,
        setUsername,
    }
})
