import nodeResolve from "@rollup/plugin-node-resolve";

export default {
    input: 'src/main.js',
    output: {
        file: 'built.js',
        format: 'iife',
        sourcemap: true,
    },
    plugins: [
        nodeResolve(),
    ],
    treeshake: true,
};