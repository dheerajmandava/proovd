import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/pulse-widget/index.ts',
  output: {
    file: 'public/pulse-widget.min.js',
    format: 'iife',
    name: 'ProovdPulse',
    sourcemap: !production
  },
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    typescript({
      tsconfig: './src/pulse-widget/tsconfig.json',
      sourceMap: !production
    }),
    production && terser()
  ]
}; 