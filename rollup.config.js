import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import globals from "rollup-plugin-node-globals";
import builtins from "rollup-plugin-node-builtins";
import uglify from "@lopatnov/rollup-plugin-uglify";

export default [
    {
        input: "src/scripts/main.js",
        output: {
            file: "public/main.min.js",
            format: "cjs",
            sourcemap: true
        },
        plugins: [
            nodeResolve({ preferBuiltins: false }), // or `true`
            commonjs(),
            globals(),
            builtins(),
            // uglify()
        ]
    }
];