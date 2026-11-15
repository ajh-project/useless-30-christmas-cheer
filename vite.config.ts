import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages(/useless-30-christmas-cheer/)에서도 동작하도록 상대 경로로 빌드
export default defineConfig({
  base: './',
  plugins: [vue()],
})
