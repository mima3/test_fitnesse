import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules", "dist", "coverage"] },

  js.configs.recommended, // 公式の推奨ルール

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // CJSなら "script"
      globals: globals.node, // Node のグローバル
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: "error",
      "prefer-const": "warn",
      "space-before-function-paren": ["error", "never"],
      "no-multi-spaces": "error",
      "padded-blocks": ["error", "never"],
      "no-trailing-spaces": "error"
    },
  },
];