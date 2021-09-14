const rc = require(`r-comments`)
rc({
  // 要处理的文件列表
  list: [
    `./**/*.*`,
    `!./use.js`,
    `!./node_modules/**`,
  ],
})