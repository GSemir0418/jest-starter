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

- 测试sum.js

```js
// src/utils/sum.js
const sum = (a, b) => {
  return a + b;
}

module.exports = sum;

// tests/utils/sum.test.js
const sum = require("../../src/utils/sum");

describe('sum', () => {
  it('可以做加法', () => {
    expect(sum(1, 1)).toEqual(2);
  });
})
```

- 运行测试

```bash
pnpm run test
```

