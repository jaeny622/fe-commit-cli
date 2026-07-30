import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
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