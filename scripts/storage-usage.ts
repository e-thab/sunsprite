import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/assets/utils/database.types'
import { GLOBAL_DB_SIZE, GLOBAL_R2_SIZE } from '../supabase/functions/_shared/uploadLimits'

process.loadEnvFile('.env.local')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.')
    console.error('VITE_SUPABASE_URL is already in .env.local for the app itself; add SUPABASE_SERVICE_ROLE_KEY')
    console.error('(Project Settings > API in the Supabase dashboard) alongside it — kept unprefixed, unlike the')
    console.error('VITE_ vars, so Vite never bundles it into client code.')
    process.exit(1)
}

// Service-role client: reads public.storage_totals directly rather than
// through the Data API's normal RLS-scoped grants, since this script wants
// the platform-wide total, not just what one signed-in user could see.
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function main() {
    // storage_totals is a cached snapshot (public.refresh_storage_totals(),
    // scheduled every 5 minutes by pg_cron — see
    // supabase/migrations/20260902120000_enforce_global_storage_quota.sql),
    // not a live aggregate query, so this is only ever a few minutes stale.
    const { data, error } = await supabase
        .from('storage_totals')
        .select('db_bytes, r2_bytes, computed_at')
        .eq('id', true)
        .single()
    if (error) throw error

    const dbPct = (data.db_bytes / GLOBAL_DB_SIZE) * 100
    const r2Pct = (data.r2_bytes / GLOBAL_R2_SIZE) * 100

    console.log(`As of ${data.computed_at} (refreshed every 5 min):\n`)
    console.log(`Database (scripts + text_files content): ${formatBytes(data.db_bytes)} — ${dbPct.toFixed(1)}% of the ${formatBytes(GLOBAL_DB_SIZE)} enforced cap`)
    console.log(`R2 (images):                              ${formatBytes(data.r2_bytes)} — ${r2Pct.toFixed(1)}% of the ${formatBytes(GLOBAL_R2_SIZE)} enforced cap`)
    console.log(`\n(Enforced caps are 90% of Supabase's 500MB free database tier / R2's 10GB free storage tier — see uploadLimits.ts.)`)
}

main().catch((err) => {
    console.error(err)
    process.exitCode = 1
})
