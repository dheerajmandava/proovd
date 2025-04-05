import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/pulse-widget/index.js',
  output: {
    file: 'dist/proovd-pulse-widget.js',
    format: 'iife',
    name: 'ProovdPulse',
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    terser()
  ]
}; 