module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the rule that runs source-map-loader
      const rules = webpackConfig.module.rules || [];
      for (const rule of rules) {
        if (!rule.oneOf) continue;

        for (const one of rule.oneOf) {
          // CRA puts source-map-loader in a "pre" rule
          if (
            one.enforce === "pre" &&
            one.use &&
            one.use.some &&
            one.use.some((u) => String(u.loader || "").includes("source-map-loader"))
          ) {
            // Exclude blockly from source map parsing
            one.exclude = Array.isArray(one.exclude) ? one.exclude : [one.exclude].filter(Boolean);
            one.exclude.push(/node_modules[\\/]blockly[\\/]/);
          }
        }
      }
      return webpackConfig;
    },
  },
};
