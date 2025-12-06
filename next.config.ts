import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		workerThreads: false,
	},
	images: {
		minimumCacheTTL: 60,
		domains: ['localhost', 'ik.imagekit.io'],
		unoptimized: process.env.NODE_ENV === 'development',
	},
	turbopack: {},
	webpack: (config, { dev }) => {
		return config
	},
	devIndicators: {},
	compress: true,
	poweredByHeader: false,
	generateBuildId: async () => 'build-' + Date.now().toString(36),
}

export default nextConfig
