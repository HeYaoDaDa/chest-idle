import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      primary: '#2563eb',
      success: '#22c55e',
      error: '#ef4444',
    },
  },
  shortcuts: {
    // 通用
    panel: 'bg-white/78 backdrop-blur-md border border-gray-300 rounded shadow-lg overflow-hidden',
    'nav-link':
      'flex flex-col justify-center items-stretch gap-0.5 p-2 px-2.5 rounded-md bg-slate-100/70 font-semibold text-gray-700 transition cursor-pointer select-none hover:bg-slate-200',
    'card-item':
      'rounded bg-white border border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer',
    'progress-bar': 'h-full bg-gradient-to-r from-cyan-400 to-primary transition-all',
  },
})
