export const readJsonBody = <T>(body: unknown): T | null => {
	if (typeof body === 'string') {
		try {
			const parsed = JSON.parse(body) as unknown
			return typeof parsed === 'object' && parsed !== null ? parsed as T : null
		} catch {
			return null
		}
	}
	return typeof body === 'object' && body !== null ? body as T : null
}
