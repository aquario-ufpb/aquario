import "@testing-library/jest-dom";

// Mock require.context for Webpack-specific features
global.require = global.require || {};
global.require.context = (_directory, _useSubdirectories, _regExp) => {
  const keys = () => [];
  const context = _key => "";
  context.keys = keys;
  context.resolve = key => key;
  context.id = "mockContext";
  return context;
};
