# r-comments
Delete comments in files in batches.

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
  // List of files to be processed
  list: [
    `test/**/*.*`,
  ],
})
```

**Command Line**
- list -- Multiple items are separated by commas.

``` sh
rc list=src/**/*.*,!./src/use.js
```

## Thanks
- [decomment](https://github.com/vitaly-t/decomment)

## License
Copyright (c) 2021-present, xw