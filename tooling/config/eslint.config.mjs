import js from "@eslint/js";
import ts from "typescript-eslint";

export default ts.config({
  extends: [js.configs.recommended],
  files: ["**/*.ts", "**/*.tsx"],
  ignores: ["dist/**", "node_modules/**"],
  languageOptions: {
    parserOptions: {
      project: false
    }
  },
  rules: {
    "no-console": "off"
  }
});
