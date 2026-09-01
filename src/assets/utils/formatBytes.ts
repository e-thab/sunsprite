/** Human-readable byte size, e.g. "512 B", "6.5 KB", "10.2 MB" — shared by every storage-usage display (ProjectsView.vue's list, StorageIndicator.vue's editor-panel footer). */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
