const cloneDeep = require("lodash.clonedeep");
const path = require("path");

const ruleChildren = loader =>
  loader.use ||
  loader.oneOf ||
  (Array.isArray(loader.loader) && loader.loader) ||
  [];

const findIndexAndRules = (rulesSource, ruleMatcher) => {
  let result = undefined;
  const rules = Array.isArray(rulesSource)
    ? rulesSource
    : ruleChildren(rulesSource);
  rules.some(
    (rule, index) =>
      (result = ruleMatcher(rule)
        ? { index, rules }
        : findIndexAndRules(ruleChildren(rule), ruleMatcher))
  );
  return result;
};

const findRule = (rulesSource, ruleMatcher) => {
  const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
  return rules[index];
};

const cssRuleMatcher = rule =>
  rule.test && String(rule.test) === String(/\.css$/);

const createLoaderMatcher = loader => rule =>
  rule.loader && rule.loader.indexOf(`/${loader}/`) !== -1;
const cssLoaderMatcher = createLoaderMatcher("css-loader");
const postcssLoaderMatcher = createLoaderMatcher("postcss-loader");
const fileLoaderMatcher = createLoaderMatcher("file-loader");

const addAfterRule = (rulesSource, ruleMatcher, value) => {
  const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
  rules.splice(index + 1, 0, value);
};

const addBeforeRule = (rulesSource, ruleMatcher, value) => {
  const { index, rules } = findIndexAndRules(rulesSource, ruleMatcher);
  rules.splice(index, 0, value);
};

function createRewireLess(
  localIdentName = `[local]___[hash:base64:5]`,
  lessLoaderOptions = {},
  include = new RegExp(`${path.sep}src${path.sep}components${path.sep}`),
  exclude = new RegExp(`${path.sep}node_modules${path.sep}`),
) {
  return function(config, env) {
    const cssRule = findRule(config.module.rules, cssRuleMatcher);
    cssRule.exclude = include;

    const lessRule = cloneDeep(cssRule);
    lessRule.test = /\.less$/;
    const cssModulesRule = cloneDeep(cssRule);

    cssModulesRule.include = include;
    cssModulesRule.exclude = exclude;

    const cssModulesRuleCssLoader = findRule(cssModulesRule, cssLoaderMatcher);
    cssModulesRuleCssLoader.options = Object.assign(
      {
        modules: true,
        localIdentName
      },
      cssModulesRuleCssLoader.options
    );
    addBeforeRule(config.module.rules, fileLoaderMatcher, cssModulesRule);

    addAfterRule(lessRule, postcssLoaderMatcher, {
      loader: require.resolve("less-loader"),
      options: lessLoaderOptions
    });
    addBeforeRule(config.module.rules, fileLoaderMatcher, lessRule);

    const lessModulesRule = cloneDeep(cssModulesRule);
    lessModulesRule.test = lessRule.test;

    addAfterRule(lessModulesRule, postcssLoaderMatcher, {
      loader: require.resolve("less-loader"),
      options: lessLoaderOptions
    });
    addBeforeRule(config.module.rules, fileLoaderMatcher, lessModulesRule);

    return config;
  };
}

const rewireLess = createRewireLess();

rewireLess.withLoaderOptions = createRewireLess;

module.exports = rewireLess;
