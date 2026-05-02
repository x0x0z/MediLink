// Babel Configuration: Transpiles and optimizes JavaScript/TypeScript for React Native apps.
// The module-resolver plugin enables clean import paths using @ instead of relative paths.
// Example: `import { Button } from "@/components/button"` instead of `../../components/button`

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
          },
        },
      ],
    ],
  };
};
