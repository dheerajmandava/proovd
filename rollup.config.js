const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');

const production = !process.env.ROLLUP_WATCH;

module.exports = {
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
      tsconfig: false,
      compilerOptions: {
        target: "es2020",
        module: "ESNext",
        moduleResolution: "node",
        esModuleInterop: true,
        sourceMap: !production,
        lib: ["dom", "es2020"],
        strict: true
      },
      include: ["src/pulse-widget/**/*.ts"]
    }),
    production && terser()
  ]
}; 