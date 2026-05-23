import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'


export default defineConfig({
  plugins: [
    react(),
    {
      name: 'export-scenarios',
      apply: 'build',
      async closeBundle() {
        const { SCENARIOS } = await import('./src/data/mockData.js');
        
        // Extract only invoice objects (no scenario ID)
        const invoices = Object.values(SCENARIOS).map(scenario => scenario.invoice);
        
        fs.writeFileSync('./src/data/mockData.json', JSON.stringify(invoices, null, 2));
        console.log('✓ Generated mockData.json (invoices only)');
      }
    }
  ],
})
