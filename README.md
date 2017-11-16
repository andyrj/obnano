# obnano
[![npm version](https://badge.fury.io/js/obnano.svg)](https://badge.fury.io/js/obnano)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/ce1befc6db9e42fabbb3e9e48c75d9e6)](https://www.codacy.com/app/andyrjohnson82/obnano?utm_source=github.com&utm_medium=referral&utm_content=andyrj/obnano&utm_campaign=badger)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/ce1befc6db9e42fabbb3e9e48c75d9e6)](https://www.codacy.com/app/andyrjohnson82/obnano?utm_source=github.com&utm_medium=referral&utm_content=andyrj/obnano&utm_campaign=Badge_Coverage)
[![Build Status](https://travis-ci.org/andyrj/obnano.svg?branch=master)](https://travis-ci.org/andyrj/obnano)

obnano = tagged template literal view (lit-html like library) + proxied observable state tree (mobx-state-tree like library) + html5 pushState router

npm install --save obnano

```jsx
import { app, Store, autorun, html, ob } from "obnano";

const header = html`<div>Header markup here...</div>`;
const footer = html`<div>Footer markup here...</div>`;

const layout = store => html`
  ${header}
  <div>
    ${ob(() => store.count)}
  </div>
  <div>
    <button onclick=${store.increment} />
  </div>
  ${footer}
`;

app(Store(
  { 
    count: 0
  }, 
  { 
    increment(ctx) {
      ctx.count += 1;
    }
  }
), layout);
```

## License

obnano is MIT licensed. See [LICENSE](LICENSE.md).
