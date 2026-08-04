import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('proxy request:', req.method, req.url, '->', options.target);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('proxy response:', proxyRes.statusCode, req.url);
            });
          }
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
