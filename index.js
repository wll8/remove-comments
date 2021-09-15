#!/usr/bin/env node

const fs = require(`fs`)
const path = require(`path`)
const decomment = require('decomment')
const uglify = require('uglify-js')
const { isText } = require('istextorbinary')
const fg = require('fast-glob');

let config = {
  // 使用 uglify 进行格式化 boolean | object
  format: false,
  
  // 要处理的文件列表
  list: [
    `test/**/*.*`,
    `!test/node_modules/**`,
  ],
  
  // 默认配置 object
  default: {
    trim: true,
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
          const res = handleJs({ext: `js`, code: $2, option, decomment})
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
  config.format = cliArg.format !== undefined ? cliArg.format : config.format
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
  config.format = config.format === true ? {
    /**
     * 压缩代码, 例如多个变量声明变为一行  
     * 如果使用了 eslint, 建议不进行压缩, 因为压缩后会产生类似的代码导致难以通过校验: 不允许再次声明变量  
     * `error: 't' is already defined (no-redeclare) at src\util\index.js:2:7`:  
     * ``` js
     * function rangeDate(e, t) {
     *   var t = (new Date(t) - new Date(e)) / 1e3 / 60 / 60 / 24,
     *     n = Math.floor(1 + t)
     *   let o = []
     *   for (let t = 0; t < n; t++) o.push(format(new Date(e).getTime() + 864e5 * t))
     *   return o
     * }
     * ```
     */
    compress: false,
    
    mangle: true, // 压缩变量名
    output: {
      /**
       * 尽最大努力保持行号, 开启此选项可能会出现问题, 导致 eslint 不能自动修复
       */
      preserve_line: false,
      
      beautify: true, // 格式化代码
      ascii_only: true, // 转义字符串和正则表达式中的 Unicode 字符
      comments: false, // 保留版权注释
      semicolons: false, // 用分号分割语句
      width: 80, // 行宽
    },
  } : config.format
  // 处理别名
  config.handle = Object.entries(config.alias).reduce((acc, [key, val]) => {
    val.forEach(alias => (acc[alias] = acc[key]))
    return acc
  }, config.handle)

  const entries = fg.sync(config.list);
  Promise.all(entries.map(filePath => new Promise((resolve, reject) => {
    try {
      if(isText(filePath)) {
        removeComment(filePath)
        // console.log(`yes  ${filePath}`)
        resolve(`yes`)
      } else {
        console.log(`skip ${filePath}`)
        resolve(`skip`)
      }
    } catch (error) {
      console.log(`err  ${filePath}`, error)
      resolve(`err`)
    }
  }))).then(arr => {
    const res = arr.reduce((prev, curr) => (prev[curr] = ++prev[curr] || 1, prev), {})
    console.log(res)
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
          return handleJs({ext, code, option, decomment})
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

function handleJs({ext, code, option, decomment}) {
  let outStr = code
  if([`js`].includes(ext) && config.format) {
    outStr = uglify.minify(outStr, config.format).code || outStr
  } else {
    outStr = decomment(code, option)|| outStr
  }
  return outStr
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