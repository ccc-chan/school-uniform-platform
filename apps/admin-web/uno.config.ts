import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      brand: {
        primary: '#2563EB',
        dark: '#1E40AF',
        navy: '#0B2F5B',
        surface: '#F5F7FA',
      },
    },
  },
  shortcuts: {
    'page-card': 'rounded-3 bg-white p-5 shadow-sm',
    'page-title': 'm-0 text-5 font-600 text-slate-900',
    'text-secondary': 'text-sm text-slate-500',
  },
})
