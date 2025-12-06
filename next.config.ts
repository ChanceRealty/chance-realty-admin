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
	webpack: (config, { dev }) => {
		if (dev) {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
				ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
			}
			config.optimization = {
				...config.optimization,
				removeAvailableModules: false,
				removeEmptyChunks: false,
				splitChunks: false,
			}
		}
		config.parallelism = 1
		return config
	},
	devIndicators: {}, 
	compress: true,
	poweredByHeader: false,
	generateBuildId: async () => 'build-' + Date.now().toString(36),
}

export default nextConfig
