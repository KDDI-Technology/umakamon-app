import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/main.js", // 自作の "エントリー" を作る
  output: {
    file: "../www/libs/animal-avatar-generator.esm.js",
    format: "esm",
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs()
  ]
};