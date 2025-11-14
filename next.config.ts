import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  
  // Optimization untuk development
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable HMR untuk fast refresh
  reactStrictMode: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enable HMR dengan file watching
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      };
      
      // Fast refresh
      config.devtool = 'cheap-module-source-map';
    }
    
    return config;
  },
  
  // SWC optimization (built-in, faster than Babel)
  swcMinify: true,
  
  // Experimental speedup
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
};

export default nextConfig;
