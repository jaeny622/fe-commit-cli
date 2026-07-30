import js from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
  ...vue.configs["flat/vue2-essential"],
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,vue}"],
    languageOptions: {
      parser: vueParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        ...globals.jquery,
        console: "readonly",
        process: "readonly",
        module: "readonly",
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-undef": "error"
    }
  }
];