import js from "@eslint/js";
import globals from "globals";

import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const globalConfig = {
  ...globals.browser,
  ...globals.es2022,
  ...globals.node,
  ...globals.es2022,
};

const baseConfig = [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,tsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globalConfig,
    },
    rules: {
      semi: ["error", "always"],
      "no-undef": "error",
    },
  },
];

const vueConfig = [
  ...vue.configs["flat/vue2-essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
    },
    rules: {
      "no-extra-boolean-cast": "off",
    },
  },
];

export default [
  ...baseConfig,
  ...vueConfig
];