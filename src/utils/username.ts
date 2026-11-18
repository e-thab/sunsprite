// Mirrors the profiles_username_format check constraint in the database; keep
// the two in sync. No '@' allowed, since sign-in uses it to tell a username
// apart from an email.
export const USERNAME_PATTERN = /^[a-z0-9_.-]{3,20}$/

export const USERNAME_HELP = 'Lowercase letters, numbers, underscores, hyphens, periods'

export const USERNAME_FORMAT_ERROR = `${USERNAME_HELP} only (3-20 characters)`
