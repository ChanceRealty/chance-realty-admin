	import type { NextConfig } from 'next'

	const nextConfig: NextConfig = {
		typescript: {
			// Dangerously allow production builds to successfully complete even if
			// your project has type errors.
			ignoreBuildErrors: true,
		},
		eslint: {
			// Allow production builds to successfully complete even if
			// your project has ESLint errors.
			ignoreDuringBuilds: true,
		},
		// Memory optimization settings
		experimental: {
			// Reduce concurrent compilation workers
			workerThreads: false,
		},
		// Reduce memory usage during compilation
		swcMinify: true,
		// Image optimization settings
		images: {
			// Optimize image loading
			minimumCacheTTL: 60,
			// Add your image domains
			domains: ['localhost', 'ik.imagekit.io'],
			// Use unoptimized for blob URLs to prevent memory issues
			unoptimized: process.env.NODE_ENV === 'development',
		},
		// Webpack configuration for memory optimization
		webpack: (config, { dev, isServer }) => {
			// Memory optimization for development
			if (dev) {
				config.watchOptions = {
					poll: 1000,
					aggregateTimeout: 300,
					ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
				}

				// Reduce memory usage in development
				config.optimization = {
					...config.optimization,
					removeAvailableModules: false,
					removeEmptyChunks: false,
					splitChunks: false,
				}
			}

			// Limit parallel processing to reduce memory usage
			config.parallelism = 1

			return config
		},
		// Development server optimization
		devIndicators: {
			buildActivity: false, // Disable build activity indicator to save memory
		},
		// Reduce bundle size
		compress: true,
		// Performance optimizations
		poweredByHeader: false,
		// Reduce static generation memory usage
		generateBuildId: async () => {
			return 'build-' + Date.now().toString(36)
		},
	}

	export default nextConfig
