export function timeAgo(dateString: string): string {
	const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)

	if (diffDays < 1) return 'today'
	if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

	const diffWeeks = Math.floor(diffDays / 7)
	if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`

	const diffMonths = Math.floor(diffDays / 30)
	if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`

	const diffYears = Math.floor(diffDays / 365)
	return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString)
	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}
