import js from "@eslint/js";
import globals from "globals";

import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const webGlobals = {
  ...globals.browser,
  ...globals.es2022,
};

const nodeGlobals = {
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
      globals: webGlobals,
    },
    rules: {
      semi: ["error", "always"],
      "no-undef": "error",
    },
  },
  {
    files: ["**/*.config.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: nodeGlobals,
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
      "no-undef": "error",
    },
  },
];

export default [
  ...baseConfig,
  ...vueConfig
];