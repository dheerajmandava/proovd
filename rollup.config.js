import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/pulse-widget/proovd-cro.ts',
  output: {
    file: 'dist/proovd-pulse-widget.js',
    format: 'iife',
    name: 'Proovd',
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      tsconfig: 'src/pulse-widget/tsconfig.json',
      outDir: 'dist'
    }),
    terser()
  ]
}; 