import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { storagePlugin } from './server/storagePlugin.js'
import { adminPlugin } from './server/adminPlugin.js'
import { authPlugin } from './server/authPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), storagePlugin(), adminPlugin(), authPlugin()],
})
