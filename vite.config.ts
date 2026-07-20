import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url' // هذا السطر ضروري جداً لإصلاح الخطأ
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// تعريف __dirname يدوياً لحل مشكلة الـ TypeScript
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) { // أضفنا : string لتعريف النوع
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  
  // إعدادات المنفذ
  server: {
    port: 5009, // (ضع 3000 للمشروع الأول و 3001 للمشروع الثاني)
  }
})