import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Production optimizations
  reactStrictMode: false, // Disable double rendering in development
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize bundle size
  experimental: {
    optimizeCss: false, // Disable due to critters error
    optimizePackageImports: ['d3', 'lodash'], // lucide-reactを除外
  },
  // サーバーサイド専用パッケージ
  serverExternalPackages: ['duckdb', 'better-sqlite3', '@mapbox/node-pre-gyp', 'mock-aws-s3', 'aws-sdk', 'nock'],
  // Webpack configuration for server-side modules
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // クライアントサイドでネイティブモジュールを除外
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        util: false,
        child_process: false,
      };
      
      // エイリアスでモックモジュールに置き換え
      config.resolve.alias = {
        ...config.resolve.alias,
        'duckdb': path.resolve(__dirname, './lib/client-mocks/duckdb.js'),
        'better-sqlite3': path.resolve(__dirname, './lib/client-mocks/sqlite.js'),
        'mock-aws-s3': path.resolve(__dirname, './lib/client-mocks/empty.js'),
        'aws-sdk': path.resolve(__dirname, './lib/client-mocks/empty.js'),
        'nock': path.resolve(__dirname, './lib/client-mocks/empty.js'),
        '@mapbox/node-pre-gyp': path.resolve(__dirname, './lib/client-mocks/empty.js'),
        'node-pre-gyp': path.resolve(__dirname, './lib/client-mocks/empty.js'),
        'fs/promises': path.resolve(__dirname, './lib/client-mocks/fs.js'),
      };
    }
    
    // 各種ファイルタイプを無視
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });
    
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
}

export default nextConfig