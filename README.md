[![Coverage Status](https://coveralls.io/repos/github/GSemir0418/jest-starter/badge.svg?branch=master)](https://coveralls.io/github/GSemir0418/jest-starter?branch=master)

参考文章：[小书介绍 | Jest 实践指南 (yanhaixiang.com)](https://github.yanhaixiang.com/jest-tutorial/)

## 1 起步

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
# 暂时只打开覆盖率和自动清除Mock，其他暂时关闭
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

## 2 转译器

- jest 本身不具有转译功能，它会在执行测试代码时调用项目已有的**转译器/编译器**来做代码转义
- 本文以 `jest x typescript` 为例

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
    // ts默认会全局加载node_modules/@types目录下的类型定义文件
    // 如果制定了types，那么其他类型定义文件将不会被全局加载
    // 可能会影响代码自动提示
    "types": ["node", "jest"]
  }
}

// jest.config.js
module.exports = {
  // ...
  // 将 ts-jest 用作 Jest 配置基础的预设
  preset: 'ts-jest'
}
```

- 配置路径简写（ts、jest、webpack 都要配）

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
    // 将引入的模块作为依赖项
    // 此处就是将src作为依赖的跟路径之一，间接实现路径映射
    moduleDirectories: ["node_modules", "src"],
    // ...
  };
  ```

  - `webpack.config.js` - `resolve` - `alias`

  ```js
  resolve: {
    // 如果不指定后缀名，会尝试按如下顺序解析该文件
    extensions: [".tsx", ".ts", ".js", ".less", "css"],
    // 设置import或require别名
    alias: {
      utils: path.join(__dirname, "src/utils/"),
    },
  },
  ```

## 3 测试环境

以测试 localStorage 为例，由于 Node.js 环境并没有 localStorage，因此会报 undefined 的错误

### 3.1 jest-setup

第一种方案，直接在全局 Mock 一个 localStorage API

1. 添加`tests/setup-test.ts`，直接魔改 global 对象

```ts
Object.defineProperty(global, "localStorage", {
  value: {
    store: {} as Record<string, string>,
    setItem(key: string, value: string) {
      this.store[key] = value;
    },
    getItem(key: string) {
      return this.store[key];
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  },
  configurable: true,
});
```

2. 然后在 jest.config.js 里添加 `setupFilesAfterEnv` 配置：

```js
module.exports = {
  setupFilesAfterEnv: ["./tests/jest-setup.ts"],
};
```

- `setupFilesAfterEnv`: 是在**安装测试框架之后**执行的代码，可以引入和配置 Jest/Jasmine（Jest 内部使用了 Jasmine） 插件
- `setupFiles`: 是**引入测试环境（比如下面的 jsdom）之后**执行的代码，可以添加测试环境的**补充**，比如 Mock 全局变量 abcd 等
- 为了简便，将统一在 setupFilesAfterEnv 中初始化 Mock

3. 执行测试，测试通过

### 3.2 jsdom

- 因为我们不可能把浏览器里所有的 API 都 Mock 一遍，而且不可能做到 100% 还原所有功能。所以 jest 提供了 `testEnvironment` 配置：

```js
module.exports = {
  testEnvironment: "jsdom",
};
```

- 添加 jsdom 测试环境后，全局会自动拥有完整的浏览器标准 API。原理是使用了 `jsdom`。 这个库用 JS 实现了一套 Node.js 环境下的 Web 标准 API。 由于 Jest 的测试文件也是 Node.js 环境下执行的，所以 Jest 用这个库充当了浏览器环境的 Mock 实现。

- 现在清空 jest-setup.ts 里的代码，直接 npm run test 也会发现测试成功：

## 4 Mock 网页地址

- “**如何在测试环境中修改网页地址**”是前端测试中非常常见的一个问题，即使我们配置了 jsdom 环境或者使用 Object.defineProperty 也无法顺利修改
- 有一个方案是将利用 jsdom.reconfigure API 修改测试环境的 url，但需要在初始化时将 jsdom 暴露到全局，且需要处理类型问题，非常麻烦
- 下面我们以把网页地址中的`查询参数字符串`转换为`对象`的需求为例

```ts
// src/utils/getSearchObj.ts
const getSearchObj = () => {
  // ?a=1&b=2
  const { search } = window.location;

  // a=1&b=2
  const searchStr = search.slice(1);

  // ['a=1', 'b=2']
  const pairs = searchStr.split("&");

  // { 'a': '1' }
  const searchObj: Record<string, string> = {};

  pairs.forEach((pair) => {
    // [a, 1]
    const [key, value] = pair.split("=");
    searchObj[key] = value;
  });

  return searchObj;
};

export default getSearchObj;

// 其实可以用下面更现代且更安全的方法(注意浏览器兼容性)
const getSearchObj = () => {
  return Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
};

export default getSearchObj;
```

- 安装`jest-location-mock`

```bash
pnpm add -D jest-location-mock@1.0.9
```

- 这个包就是专门用于修改网页地址的。缺点是我们只能用它 Mock 的 3 个 API：
  - window.location.assign
  - reload
  - replace
- 然后在 setup 文件 tests/jest-setup.ts 里全局引入一下：

```ts
// jest-setup.ts
// 使用 Jest 的 Spy 和扩展 expect 来 Mock `window.location`
import "jest-location-mock";
```

- 测试代码改为

```ts
// tests/utils/getSearchObj.test.ts
import getSearchObj from "utils/getSearchObj";

describe("getSearchObj", () => {
  it("可以获取当前网址的查询参数对象", () => {
    window.location.assign("https://www.baidu.com?a=1&b=2");

    expect(window.location.search).toEqual("?a=1&b=2");
    expect(getSearchObj()).toEqual({
      a: "1",
      b: "2",
    });
  });

  it("空参数返回空", () => {
    window.location.assign("https://www.baidu.com");

    expect(window.location.search).toEqual("");
    expect(getSearchObj()).toEqual({});
  });
});
```

## 5 测试驱动开发

- 概念：
  - TDD（Test Driven Development） 即**测试驱动开发**：先写测试，再写业务代码，当所有测试用例都通过后，你的业务代码也就实现完了
  - 而 BDD（Behavior Driven Development）行为驱动测试，与之不同是站在用户的角度描述测试用例
- 优势
  - TDD 的主要作用不是保证代码质量，而是给开发者创造一个更友好的开发环境，在这基础上保障了代码的主逻辑。
  - TDD 比较适合那些**实现复杂，但输入输出很明确**的场景。因此，TDD 也被广泛用到工具函数，数据转换函数，以及后端的接口测试。

## 6 Mock Timer

## 6.1 基础 Timer 测试

- 当需要测试计时器相关的代码时，如果计时器时间过长，会极大地影响测试效率
- 因此 jest 提供了一些关于 Mock Timer 的 API
  1. **`useFakeTimers`**: 让 jest 使用假的 Timer（包括 Date 等 API），应在每次测试前（beforeAll）调用
  2. **`runAllTimers`**: 将宏任务队列（例如`setTimeout()`、`setInterval()`、`setImmediate()`）与微任务队列（`process.nextTick`）快速执行完毕
  3. **`spyOn`**:创建一个类似于 `jest.fn` 的模拟函数，但同时也会跟踪对 `object[methodName]` 的调用。返回 Jest 模拟函数。
  4. **`fn`**: Mock 一个假函数

- 以 **1s 后执行回调**的需求为例：

```ts
// src/utils/after1000ms.ts
type AnyFunction = (...args: any[]) => any;

const after1000ms = (callback?: AnyFunction) => {
  console.log("准备计时");
  setTimeout(() => {
    console.log("午时已到");
    callback && callback();
  }, 1000);
};

export default after1000ms;
```
- 测试代码
```ts
// tests/utils/after1000ms.ts
import after1000ms from "utils/after1000ms";

describe("after1000ms", () => {
  // 利用jest mock timers
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("可以在 1000ms 后自动执行函数", () => {
    // 通过spyon监听setTimeout方法
    jest.spyOn(global, "setTimeout");
    // 构造一个假函数
    const callback = jest.fn();
    // 期待此时setTimeout没有被调用
    expect(callback).not.toHaveBeenCalled();
    // 执行测试函数
    after1000ms(callback);
    // 快进时间。。。。。（将所有定时器方法快进到结束）
    jest.runAllTimers();
    // 期待此时callback被调用
    expect(callback).toHaveBeenCalled();
    // 期待此时setTimeout被执行一次
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });
});

```