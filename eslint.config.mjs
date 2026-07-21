import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: [".next/**", "node_modules/**", "generated/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } },
    plugins: { "@next/next": nextPlugin },
    rules: nextPlugin.configs.recommended.rules
  }
];
