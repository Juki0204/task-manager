import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [lineClamp],
}

// module.exports = {
//   purge: [],
//   darkMode: false, // or 'media' or 'class'
//   variants: {
//     extend: {},
//   },
// }

export default config;