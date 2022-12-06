[![Coverage Status](https://coveralls.io/repos/github/GSemir0418/jest-starter/badge.svg?branch=master)](https://coveralls.io/github/GSemir0418/jest-starter?branch=master)
参考文章：[小书介绍 | Jest 实践指南 (yanhaixiang.com)](https://github.yanhaixiang.com/jest-tutorial/)

# 1 起步

- 初始化项目

```bash
mkdir jest-starter
cd jest-starter
npm init -y
git init
# 安装依赖
pnpm i -D jest@27.5.1
# 用jest-cli初始化jest配置文件
npx jest --init
# 暂时只打开覆盖率和自动清除Mock
```

- 测试 sum.js

```js
// src/utils/sum.js
const sum = (a, b) => {
  return a + b;
};

module.exports = sum;

// tests/utils/sum.test.js
const sum = require("../../src/utils/sum");

describe("sum", () => {
  it("可以做加法", () => {
    expect(sum(1, 1)).toEqual(2);
  });
});
```

- 运行测试

```bash
pnpm run test
```

- 运行指定测试文件

```bash
pnpm run test /tests/utils/sum.test.js
```

# 2 转译器

常见的转译器有`babel`, `tsc`, `esbuild`, `swc`

- 安装 `typescript`、`ts-jest`（使 jest 能够测试 ts 文件）、jest 类型定义

```bash
pnpm add -D typescript@4.6.3 ts-jest@27.1.4 @types/jest@27.4.1
```

- 利用`tsc`初始化 `tsconfig`

```bash
npx tsc --init
```

- 配置 config

```ts
// tsconfig.json
{
	"compilerOptions": {
    	"types": ["node", "jest"]
	}
}
// jest.config.js
module.exports = {
    // ...
    //
    preset: 'ts-jest'
}
```

- 配置路径简写

  - `tsconfig.json`-`compilerOptions`-`paths`

  ```json
  {
    "compilerOptions": {
      "baseUrl": "./",
      "paths": {
        "utils/*": ["src/utils/*"]
      }
    }
  }
  ```

  - `jest.config.js`-`moduleDirectories`

  ```js
  module.exports = {
    moduleDirectories: ["node_modules", "src"],
    // ...
  };
  ```
