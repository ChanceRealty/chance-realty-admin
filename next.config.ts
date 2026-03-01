import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		workerThreads: false,
		serverActions: {
			bodySizeLimit: '200mb',
		},
	},
	images: {
		minimumCacheTTL: 60,
		domains: ['localhost', 'ik.imagekit.io'],
		unoptimized: process.env.NODE_ENV === 'development',
	},
	turbopack: {},
	webpack: config => {
		return config
	},
	devIndicators: {},
	compress: true,
	poweredByHeader: false,
	generateBuildId: async () => 'build-' + Date.now().toString(36),
}

export default nextConfig
