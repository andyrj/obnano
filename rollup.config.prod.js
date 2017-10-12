import minify from "rollup-plugin-babel-minify";
import babel from "rollup-plugin-babel";

export default {
  input: "./src/index.js",
  name: "bnano",
  output: {
    file: "./dist/idiom.js",
    format: "umd"
  },
  sourcemap: true,
  plugins: [
    babel({
      babelrc: false,
      presets: [["es2015", { modules: false }]],
      plugins: []
    }),
    minify({ comments: false })
  ],
  globals: {},
  external: []
};
