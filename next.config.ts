/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply these changes for client-side bundles
    if (!isServer) {
      // Ignore all modules that should only run on the server
      config.resolve.alias = {
        ...config.resolve.alias,
        // Explicitly ignore problematic packages
        "@mapbox/node-pre-gyp": false,
        bcrypt: false,
        bcryptjs: false,
        crypto: false,
        "node-pre-gyp": false,
      };

      // Provide fallbacks for Node.js built-in modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        child_process: false,
      };
    }

    return config;
  },
  // Updated from experimental.serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: [
    "bcrypt",
    "bcryptjs",
    "@mapbox/node-pre-gyp",
    "node-pre-gyp",
  ],
  images: {
    // Updated from domains to remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "**",
      },
    ],
    domains: [
      "i.imgur.com",
      "pvxgdxptyhamvoly.public.blob.vercel-storage.com", // Add your specific Vercel Blob storage domain here
      "vercel-blob.com",
      "*.public.blob.vercel-storage.com", // This wildcard might work for all Vercel Blob storage domains
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
