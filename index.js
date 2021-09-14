#!/usr/bin/env node

const fs = require(`fs`)
const path = require(`path`)
const decomment = require('decomment')
const fg = require('fast-glob');

let config = {
  // 要处理的文件列表
  list: [
    `test/**/*.*`,
    `!test/node_modules/**`,
  ],
  
  // 默认配置 object
  default: {
    trim: false,
  },
  
  // 自定义处理逻辑
  handle: {
    css: {
      ignore: /url\([\w\s:\/=\-\+;,]*\)/g,
    },
    
    // 自己处理 object | function | function[]
    html: [
      // html
      ({code, option, decomment}) => {
        return decomment(code, option)
      },
      // js
      ({code, option, decomment}) => {
        const outStr = code.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gm, ($0, $1, $2, $3) => {
          const res = decomment($2, option)
          return `${$1}${res}${$3}`
        })
        return outStr
      },
      // css
      ({code, option, decomment}) => {
        const outStr = code.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gm, ($0, $1, $2, $3) => {
          const res = decomment.text($2, option)
          return `${$1}${res}${$3}`
        })
        return outStr
      },
    ],
  },
  
  // 文件后缀别名
  alias: {
    html: [`htm`,`vue`],
  },
}

if (require.main === module) {
  let cliArg = parseArgv()
  config.list = cliArg.list ? cliArg.list.split(`,`) : []
  rc(config)
}

/**
 * 根据配置删除注释
 * @param {object} config 
 * @param {array} config.list -- 要处理的文件列表
 * @param {object} config.default -- 默认配置
 * @param {object} config.handle -- 自定义处理逻辑
 * @param {object} config.alias -- 文件后缀别名
 */
function rc(userConfig) {

  config.list = userConfig.list || [] 

  config.default = {
    ...userConfig.default,
    ...config.default,
  }
  config.handle = {
    ...userConfig.handle,
    ...config.handle,
  }
  config.alias = {
    ...userConfig.alias,
    ...config.alias,
  }
  // 处理别名
  config.handle = Object.entries(config.alias).reduce((acc, [key, val]) => {
    val.forEach(alias => (acc[alias] = acc[key]))
    return acc
  }, config.handle)

  const entries = fg.sync(config.list);
  entries.forEach(filePath => {
    try {
      removeComment(filePath)
      console.log(`yes ${filePath}`)
    } catch (error) {
      console.log(`err ${filePath}`, error)
    }
  })
}

/**
 * 删除文件中的注释
 * @param {*} filePath 文件路径
 */
function removeComment(filePath) {
  const str = fs.readFileSync(filePath, `utf8`)
  let outStr = str
  const ext = path.parse(filePath).ext.replace(`.`, ``)
  const handle = config.handle[ext]
  const extHandle = (() => {
    if(isType(handle, `function`)) {
      return [handle]
    }
    if(isType(handle, `array`)) {
      return handle
    }
    if(isType(handle, `object`) || isType(handle, `undefined`)) {
      return [({code, option, decomment}) => {
        option = handle || option
        if([`js`, `json`].includes(ext)) {
          return decomment(code, option)
        } else {
          return decomment.text(code, option)
        }
      }]
    }
  })();
  
  extHandle.forEach(fn => {
    outStr = fn({code: outStr, option: config.default, decomment})
  })

  fs.writeFileSync(filePath, outStr, `utf8`)
}

/**
 * 判断数据是否为 type, 或返回 type
 * @param {*} data 
 * @param {*} type 
 * @returns 
 */
function isType(data, type = undefined) {
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}

/**
 * 解析命令行参数
 * @param {*} arr 
 * @returns 
 */
function parseArgv(arr) {
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, ...v] = arg.split('=')
    v = v.join(`=`) // 把带有 = 的值合并为字符串
    acc[k] = v === '' // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === 'true'
        : (
          /[\d|.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}

module.exports = rc