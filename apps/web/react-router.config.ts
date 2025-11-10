import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	// Disable prerender during build to avoid executing the server bundle, which
	// attempts to dynamically scan build/server/src/app/api and fails in CI.
	// We'll run server-only at runtime on Railway.
	prerender: false,
} satisfies Config;
