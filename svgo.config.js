/** @type {import('svgo').Config} */
export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          collapseGroups: false,
          removeUnknownsAndDefaults: false,
        },
      },
    },
  ],
};
