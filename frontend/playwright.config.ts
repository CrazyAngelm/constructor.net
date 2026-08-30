import { defineConfig, devices } from '@playwright/test'

const port = 18180
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
	testDir: './tests/e2e',
	use: {
		baseURL,
		trace: 'retain-on-failure',
	},
	webServer: {
		command: `npm run start -- -p ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		env: {
			NEXTAUTH_URL: baseURL,
			NEXTAUTH_SECRET: 'local-e2e-preview-only',
			DATABASE_URL: 'mysql://preview:preview@127.0.0.1:65535/labstudio_preview',
			PREVIEW_DEPLOYMENT_MODE: 'isolated-preview',
			PREVIEW_RESTRICT_EXTERNAL_FLOWS: 'true',
			BILLING_CRON_ENABLED: 'true',
		},
	},
	projects: [
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
	],
})
