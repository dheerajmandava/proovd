import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

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
    replace({
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      preventAssignment: true
    }),
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: false,
      compilerOptions: {
        target: "es2020",
        module: "ESNext",
        moduleResolution: "node",
        esModuleInterop: true,
        sourceMap: !production,
        inlineSources: !production,
        lib: ["dom", "es2020"],
        strict: true
      },
      include: ["src/pulse-widget/**/*.ts"]
    }),
    production && terser()
  ]
}; 