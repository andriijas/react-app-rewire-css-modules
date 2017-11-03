# react-app-rewire-css-modules

Add [CSS Module](https://github.com/css-modules/css-modules) loaders to your [create-react-app](https://github.com/facebookincubator/create-react-app) via [react-app-rewired](https://github.com/timarney/react-app-rewired).

CSS Module styles can be written in CSS or LESS.

## Installation

This package is not yet published to the npm registry. Install from GitHub:

```
yarn add --dev andriijas/react-app-rewire-less-modules
```

OR

```
npm install --save-dev andriijas/react-app-rewire-less-modules
```

## Usage

`*.css` and `*.less` files in `src/components` will load as css/less modules.
`*.css` and `*.less` files in node_modules will load as regular styles (no modules) - typically useful for 3rd party libraries.

### Example

In your react-app-rewired configuration:

```javascript
/* config-overrides.js */

const rewireLess = require('react-app-rewire-less-modules');

module.exports = function override(config, env) {
    // ...
    config = rewireLess(config, env);
    // with loaderOptions
    // config = rewireLess.withLoaderOptions('', someLoaderOptions)(config, env);
    // with override localIdentName
    // config = rewireLess.withLoaderOptions(
    //   `${env === "production" ? "foobar" : "[local]"}-[hash:base64:8]`,
    //)(config, env);
    // ...
    return config;
}
```

In your React application:

```less
// src/components/Footer.less

.app {
  color: aqua;
  
  &:hover {
    color: lawngreen;
  }
}
```

```jsx harmony
// src/components/Footer.js

import React from 'react';
import styles from './Footer.less';

export default ({text}) => (
    <div className={styles.footer}>{text}</div>
)
```
