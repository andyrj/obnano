import minify from "rollup-plugin-babel-minify";
import babel from "rollup-plugin-babel";

export default {
  input: "./src/index.js",
  name: "obnano",
  output: {
    file: "./dist/obnano.js",
    format: "umd"
  },
  sourcemap: true,
  plugins: [
    babel({
      babelrc: false,
      presets: [["env", { modules: false }]],
      plugins: []
    }),
    minify({ comments: false })
  ],
  globals: {
    "post-js": "postJs",
    ulit: "ulit"
  },
  external: ["post-js", "ulit"]
};
