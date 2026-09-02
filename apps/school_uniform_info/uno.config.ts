import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      ink: '#102A43',
      cloth: '#F4F7F5',
      thread: '#C74235',
      verify: '#167D59',
      muted: '#6B7C8F',
    },
  },
})
