const fs = require(`fs`)
const decomment = require('decomment')
const fg = require('fast-glob');
const entries = fg.sync([ // 要处理的文件
  // `test/**/*.js`,
  // `!test/**/*.vue`,
]);
console.log(`entries`, entries)
entries.forEach(filePath => {
  try {
    removeComment(filePath)
  } catch (error) {
    console.log(`error`, error)
  }
})

function removeComment(filePath) {
  const str = fs.readFileSync(filePath, `utf8`)
  let outStr = str
  if(filePath.match(/.vue$/)) {
    outStr = outStr.replace(/<template[\s\S]+?template>/, ($0) => {
      const res = decomment($0, {
        trim: true,
      })
      return res
    })
    outStr = outStr.replace(/(<script>)([\s\S]+?)(<\/script>)/, ($0, $1, $2, $3) => {
      const res = decomment($2, {
        trim: true,
      })
      return `${$1}${res}${$3}`
    })
  } else if(filePath.match(/.js$/)) {
    outStr = decomment(str, {
      trim: true,
    });
  }
  
  fs.writeFileSync(filePath, outStr, `utf8`)
}
