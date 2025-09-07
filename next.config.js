/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'storage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  transpilePackages: ['firebase'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }
    
    // Fix for undici compatibility
    config.externals = config.externals || []
    config.externals.push({
      'undici': 'undici'
    })
    
    return config
  },
}

module.exports = nextConfig
