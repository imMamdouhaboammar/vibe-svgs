/** @type {import('svgo').Config} */
export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,
          removeTitle: false,
          removeDesc: false,
          cleanupIds: false,
          collapseGroups: false,
          removeUnknownsAndDefaults: false,
        },
      },
    },
  ],
};
