# r-comments
Delete comments in files in batches.

![20210915193210](https://cdn.jsdelivr.net/gh/wll8/static@master/tc/20210915193210.png)

## Features
- Supports batch processing of files using the `glob` method
- Delete single-line multi-line comments from html, js, json, css/text
- Keep the layout/format of the original document
- Delete lines with only comments
- Compatible with css3, json5, es6
- Support mixed content, such as js/css in html/vue

**E.g**
- html, vue
- js, json
- css
- Other `//` and `/**/` comment style files

When the type is `js, json`, it will be grammatically analyzed, and other types are treated as ordinary text, and `//` and `/**/` are deleted by default.
## Example of use
``` js
const rc = require(`r-comments`)
rc({
  // Format with uglify
  format: false,
  
  // List of files to be processed
  list: [
    `test/**/*.*`,
  ],

  // The default configuration, it is the options of decomment
  default: {
    trim: true,
  },

  // Custom configuration or processing logic
  handle: {
    css: {
      ignore: /url\([\w\s:\/=\-\+;,]*\)/g,
    },
  },
})
```

**Command Line**
- list -- Multiple items are separated by commas.

``` sh
rc list=src/**/*.*,!./src/use.js
```

You can also use it with commands like `npm run lint --fix`.

## Thanks
- [decomment](https://github.com/vitaly-t/decomment)

## License
Copyright (c) 2021-present, xw