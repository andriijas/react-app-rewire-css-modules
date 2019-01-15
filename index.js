const path = require("path");

const loaderNameMatches = function (rule, loader_name) {
  return rule && rule.loader && typeof rule.loader === 'string' &&
    (rule.loader.indexOf(`${path.sep}${loader_name}${path.sep}`) !== -1 ||
      rule.loader.indexOf(`@${loader_name}${path.sep}`) !== -1);
};

const getLoader = function (rules, matcher) {
  let loader;

  rules.some(rule => {
    return (loader = matcher(rule)
      ? rule
      : getLoader(rule.use || rule.oneOf || (Array.isArray(rule.loader) && rule.loader) || [], matcher));
  });

  return loader;
};

const lessExtension = /\.less$/;
const lessModuleExtension = /\.module.less$/;

function createRewireLess(lessLoaderOptions = {}) {
  // Set javascriptEnabled default value to true
  lessLoaderOptions = Object.assign({ javascriptEnabled: true}, lessLoaderOptions);
  return function(config, env) {
    // Exclude all less files (including module files) from file-loader
    const fileLoader = getLoader(config.module.rules, rule => {
      return loaderNameMatches(rule, "file-loader") && rule.exclude;
    });
    fileLoader.exclude.push(lessExtension);

    const createRule = (rule, cssRules) => {
      if (env === "production") {
        return {
          ...rule,
          loader: [
            ...(cssRules.loader || cssRules.use),
            { loader: "less-loader", options: lessLoaderOptions },
          ],
        };
      } else {
        return {
          ...rule,
          use: [
            ...cssRules.use,
            { loader: "less-loader", options: lessLoaderOptions },
          ],
        };
      }
    };

    const lessRules = createRule(
      {
        test: lessExtension,
        exclude: lessModuleExtension,
      },
      // Get a copy of the CSS loader
      getLoader(
        config.module.rules,
        rule => String(rule.test) === String(/\.css$/),
      ),
    );

    const lessModuleRules = createRule(
      { test: lessModuleExtension },
      // Get a copy of the CSS module loader
      getLoader(
        config.module.rules,
        rule => String(rule.test) === String(/\.module\.css$/),
      ),
    );

    const oneOfRule = config.module.rules.find(
      rule => rule.oneOf !== undefined,
    );
    if (oneOfRule) {
      oneOfRule.oneOf.unshift(lessRules);
      oneOfRule.oneOf.unshift(lessModuleRules);
    } else {
      // Fallback to previous behaviour of adding to the end of the rules list.
      config.module.rules.push(lessRules);
      config.module.rules.push(lessModuleRules);
    }

    return config;
  };
}

const rewireLess = createRewireLess();

rewireLess.withLoaderOptions = createRewireLess;

module.exports = rewireLess;