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

- 现在清空 jest-setup.ts 里的代码，直接 npm run test 也会发现测试成功

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

### 6.2 Fake Timer

Jest 的 `Fake Timer` 就是把 setTimeout 等`延时 API` 的回调都收集到自己的 `Queue` 里， 你可以随时随地清算这个 `Queue`，而不需要等 XX 毫秒后再一个个执行。

- 需求：利用 Promise 以及 setTimeout 来实现程序的 sleep 效果

```ts
const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export default sleep;
```

- 测试代码

```ts
import sleep from "utils/sleep";

describe("sleep", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("可以睡眠1000ms", async () => {
    const callback = jest.fn();
    const act = async (callback: () => void) => {
      await sleep(1000);
      callback();
    };

    // 利用promise变量存储sleep返回的Promise
    const promise = act(callback);
    // mockCallback 还未调用
    expect(callback).not.toBeCalled();
    // 清算 Jest 宏任务队列的回调，其中会执行 setTimeout 里的 resolve 函数
    // 就会把callback()放入微任务队列
    jest.runAllTimers();
    // 执行 callback 内容
    // 利用await将expec同步代码延后至promise被resolve之后执行
    await promise;
    // mockCallback 已调用
    expect(callback).toBeCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

## 7 配置 React

- 安装依赖（在后面使用时会一一介绍）

```bash
# Webpack 依赖及插件
pnpm add -D webpack@5.72.0 webpack-cli@4.10.0 webpack-dev-server@4.8.1 html-webpack-plugin@5.5.0

# Loader
pnpm add -D less@4.1.2 less-loader@10.2.0 style-loader@3.3.1 css-loader@6.7.1 ts-loader@9.2.8

# React 以及业务
pnpm add react@17.0.2 react-dom@17.0.2 axios@0.26.1 antd@4.19.5 classnames@2.3.1
pnpm add -D @types/react@17.0.2 @types/react-dom@17.0.2
```

- 在根目录添加 Webpack 配置文件 `webpack.config.js`：

```js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/index.tsx",
  },
  module: {
    rules: [
      // 解析 TypeScript
      {
        test: /\.(tsx?|jsx?)$/,
        use: "ts-loader",
        exclude: /(node_modules|tests)/,
      },
      // 解析 CSS
      {
        test: /\.css$/i,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      // 解析 Less
      {
        test: /\.less$/i,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: (resourcePath) => {
                  if (/pure.css$/i.test(resourcePath)) {
                    return "pure";
                  }
                  if (/global.css$/i.test(resourcePath)) {
                    return "global";
                  }
                  return "local";
                },
              },
            },
          },
          { loader: "less-loader" },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".less", "css"],
    // 设置别名
    alias: {
      utils: path.join(__dirname, "src/utils/"),
      components: path.join(__dirname, "src/components/"),
      apis: path.join(__dirname, "src/apis/"),
      hooks: path.join(__dirname, "src/hooks/"),
      store: path.join(__dirname, "src/store/"),
    },
  },
  devtool: "inline-source-map",
  // 3000 端口打开网页
  devServer: {
    static: "./dist",
    port: 3000,
    hot: true,
  },
  // 默认输出
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  // 指定模板 html
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
```

- 在 `public/index.html` 添加模板 HTML 文件：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

- 在 `package.json` 添加启动命令：

```json
{
  "scripts": {
    "start": "webpack serve",
    "test": "jest"
  }
}
```

- 在 `src/index.tsx` 添加入口：

```tsx
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "antd/dist/antd.css";

ReactDOM.render(<App />, document.querySelector("#root"));
```

- 添加 `src/App.tsx` 根组件：

```jsx
import React from "react";
import { Button } from "antd";

const App = () => {
  return (
    <div>
      <h1>Hello</h1>
      <Button>点我</Button>
    </div>
  );
};

export default App;
```

- `tsconfig.json`完善路径映射

```json
{
  "compilerOptions": {
    "jsx": "react",
    "esModuleInterop": true,
    "baseUrl": "./",
    "paths": {
      "utils/*": ["src/utils/*"],
      "components/*": ["src/components/*"],
      "apis/*": ["src/apis/*"],
      "hooks/*": ["src/hooks/*"],
      "store/*": ["src/store/*"]
    }
  }
}
```

- 现在执行 `npm run start`，进入 localhost:3000 就能看到我们的页面了

## 8 快照测试

- 快照测试**思路**：
  先执行一次测试，把输出结果记录到 .snap 文件，以后每次测试都会把输出结果和 .snap 文件做对比

### 8.1 Title 组件测试

- 安装 react 测试库

```bash
pnpm add -D @testing-library/react@12.1.4
```

- 需求：

```tsx
import React from "react";
export const Title = (props: { title: string }) => {
  const { title } = props;
  return <p style={{ fontSize: "20px", color: "red" }}>{title}</p>;
};
```

- 测试代码：

```tsx
describe("Title", () => {
  it("可以正确渲染标题", () => {
    const { baseElement } = render(<Title title="大字" />);
    expect(baseElement).toMatchSnapshot();
  });
});
```

- 执行测试后，会在同级目录生成`/__snashots__/Title.test.tsx.snap`快照文件，第一次执行一般都是成功的（老项目刷测试覆盖率常用手段）

### 8.2 快照测试分析

- 快照**失败**有两种可能：

  1. 业务代码变更后导致输出结果和以前记录的 .snap 不一致，说明业务代码有问题，要排查 Bug
  2. 业务代码有更新导致输出结果和以前记录的 .snap 不一致，新增功能改变了原有的 DOM 结构，要用 `npx jest --updateSnapshot` 更新当前快照

- 快照测试的**硬伤**：

  - 不过现实中这两种失败情况并不好区分，更多的情况是你既在重构又要加新需求，这就是为什么快照测试会出现 “假错误”。而如果开发者还滥用快照测试，并生成很多大快照， 那么最终的结果是没有人再相信快照测试。一遇到快照测试不通过，都不愿意探究失败的原因，而是选择更新快照来 “糊弄一下”。

- 快照测试**注意事项**：

  1. 生成小快照。 只取重要的部分来生成快照，必须保证快照是能让你看懂的
  2. 合理使用快照。 快照测试不是只为组件测试服务，同样组件测试也不一定要包含快照测试。快照能存放一切可序列化的内容。

- 根据上面两点，还能总结出快照测试的**适用场景**：
  - 组件 DOM 结构的对比
  - 在线上跑了很久的老项目
  - 大块数据结果的对比

## 9 组件测试

### 9.1 需求

实现一个 AuthButton，通过 getLoginState 获取当前用户的身份并在按钮中展示用户身份。

- 实现 AuthButton 业务组件
- 在 API 函数 getLoginState 发请求获取用户身份
- 把 Http 请求的返回 loginStateResponse 展示到按钮上

#### 9.1.1 组件代码

`src/components/AuthButton/index.tsx`：

```tsx
// src/components/AuthButton/index.tsx
import React, { FC, useEffect, useState } from "react";
import { Button, ButtonProps, message } from "antd";
import classnames from "classnames";
import styles from "./styles.module.less";
import { getUserRole, UserRoleType } from "apis/user";

type Props = ButtonProps;

// 身份文案 Mapper
const mapper: Record<UserRoleType, string> = {
  user: "普通用户",
  admin: "管理员",
};

const AuthButton: FC<Props> = (props) => {
  const { children, className, ...restProps } = props;

  const [userType, setUserType] = useState<UserRoleType>();

  // 获取用户身份并设置
  const getLoginState = async () => {
    const res = await getUserRole();
    setUserType(res.data.userType);
  };

  useEffect(() => {
    // 只要有()就说明执行了 不用.then
    getLoginState().catch((e) => message.error(e.message));
  }, []);

  return (
    <Button {...restProps} className={classnames(className, styles.authButton)}>
      {mapper[userType!] || ""}
      {children}
    </Button>
  );
};

export default AuthButton;
```

#### 9.1.2 测试代码

```tsx
// tests/components/AuthButton/simple.test.tsx
import { render, screen } from "@testing-library/react";
import AuthButton from "components/AuthButton";
import React from "react";

describe("AuthButton", () => {
  it("可以正常展示", () => {
    render(<AuthButton>登录</AuthButton>);
    // toBeDefined 存在一定局限性，后面会换
    expect(screen.getByText("登录")).toBeDefined();
  });
});
```

### 9.2 less 转译（ts+jest）

#### 9.2.1 ts 添加 less 类型定义

在全局类型声明文件 src/types/global.d.ts 里添加 .less 文件的类型定义：

```ts
// src/types/global.d.ts
declare module "*.less" {
  const content: any;
  export default content;
}
```

#### 9.2.2 jest 支持静态资源转译

运行测试时，Jest 不会转译任何内容。对于 ts/tsx 文件，我们选用的是 tsc（ts-jest）来转译；对于 css/less 等静态资源文件，jest 是没办法解析并执行的
使用 jest-transform-stub 这个库来转译静态资源：

```bash
pnpm add -D jest-transform-stub@2.0.0
```

然后在 jest.config.js 里添加转译配置：

```js
// jest.config.js
module.exports = {
  // ...
  transform: {
    ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$":
      "jest-transform-stub",
  },
};
```

### 9.3 更多 Matchers

#### 9.3.1 @testing-library/jest-dom

@testing-library/jest-dom 这个库提供了很多关于 DOM 的 Matcher API：

- toBeDisabled
- toBeEnabled
- toBeEmptyDOMElement
- toBeInTheDocument
- toBeInvalid
- toBeRequired
- toBeValid
- toBeVisible
- toContainElement
- toContainHTML
- toHaveAccessibleDescription
- toHaveAccessibleName
- toHaveAttribute
- toHaveClass
- toHaveFocus
- toHaveFormValues
- toHaveStyle
- toHaveTextContent
- toHaveValue
- toHaveDisplayValue
- toBeChecked
- toBePartiallyChecked
- toHaveErrorMessage

#### 9.3.2 使用

```bash
pnpm add -D @testing-library/jest-dom@5.16.4
```

然后在 tests/jest-setup.ts 里引入一下：

```ts
// tests/jest-setup.ts
import "@testing-library/jest-dom";
// ...
```

同时，要在 tsconfig.json 里引入这个库的类型声明：

```json
{
  "compilerOptions": {
    "types": ["node", "jest", "@testing-library/jest-dom"]
  }
}
```

修改测试断言代码：

```tsx
expect(screen.getByText("登录")).toBeInTheDocument();
```

### 9.4 三种测试方案

- 测试涉及到**网络请求**，这里我们给出三种测试方案

#### 9.4.1 Mock axios

使用 jest.spyOn 对 axios.get()方法进行监听，并利用 mockResolvedValueOnce 指定其响应内容

#### 9.4.2 Mock API 实现

与 mock axios 思路差不多，使用 jest.spyOn 对 api 的返回值进行 mock

#### 9.4.3 Mock Http 请求

前两种思路比较好理解，实际开发中也比较方便实践
但对于单元测试思想来说，过于偏向细节
我们可以不 Mock 任何函数实现，只对 Http 请求进行 Mock，即利用 msw 搭建一个面向测试的服务：

> msw 可以拦截指定的 Http 请求，是做测试时一个非常强大好用的 Http Mock 工具。

```sh
pnpm add -D msw@0.39.2
```

先在 tests/mockServer/handlers.ts 里添加 Http 请求的 Mock Handler：

```ts
import { rest } from "msw";

const handlers = [
  rest.get("https://whatever/site/api/role", async (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ userType: "user" }))
  ),
];
export default handlers;
```

然后在 tests/mockServer/server.ts 里使用这些 handlers 创建 Mock Server 并导出它：

```ts
import { setupServer } from "msw/node";
import handlers from "./handlers";

const server = setupServer(...handlers);

export default server;
```

最后，在我们的 tests/jest-setup.ts 里使用 Mock Server：

```ts
import server from "./mockServer/server";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

如果你想在某个测试文件中想单独指定某个接口的 Mock 返回， 可以使用 server.use(mockHandler) 来实现。

测试代码：

```tsx
// tests/components/AuthButton/mockHttp.test.tsx
// 更偏向真实用例，效果更好
import { render, screen } from "@testing-library/react";
import { UserRoleType } from "apis/user";
import AuthButton from "components/AuthButton";
import { rest } from "msw";
import React from "react";
import server from "../../mockServer/server";

// 初始化函数
// 其实可以直接使用handler
// server.use(mockHandler)
// 但为了更灵活，声明了setup函数，支持传入参数
const setup = (userType: UserRoleType) => {
  server.use(
    rest.get("https://whatever/site/api/role", async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ userType }));
    })
  );
};

describe("AuthButton Mock Http 请求", () => {
  it("可以正确展示普通用户按钮内容", async () => {
    setup("user");
    render(<AuthButton>你好</AuthButton>);
    expect(await screen.findByText("普通用户你好")).toBeInTheDocument();
  });
  it("可以正确展示管理员按钮内容", async () => {
    setup("admin");
    render(<AuthButton>你好</AuthButton>);
    expect(await screen.findByText("管理员你好")).toBeInTheDocument();
  });
});
```

#### 9.4.4 总结

单元测试的核心思想是**像真实用户那样去测你的代码**

这里说的用户一共分为两种：

1. 普通用户。即使用网页的人
2. 开发者。接口使用者、数据消费者、API 调用侠

对于上述用例来说，需求主要是针对普通用户，则不需要测试代码实现细节，按照用户的操作逻辑与感知，得到正确的结果即可

对于工具类库/组件库这类的测试需求，我们针对的用户则变成了开发者，那么就需要针对代码逻辑与实现细节进行测试

## 10 Redux 测试

### 10.1 需求实现

现在我们来实现一个用户模块：点击 “获取用户” 按钮，发请求拉取用户信息存到 redux 中，并在页面展示用户信息。

```bash
pnpm add @reduxjs/toolkit@1.8.1 react-redux@8.0.1 redux@4.2.0
```

创建 src/store 目录，里面存放一个 src/store/user/reducer.ts 作为 userSlice 的 reducer：

```ts
// src/store/user/reducer.ts
import { createSlice } from "@reduxjs/toolkit";
import { fetchUserThunk } from "./thunks";

const initialState = {
  id: "",
  name: "",
  age: 0,
  status: "",
};

// 该函数接收一个初始化state对象，和一个reducer对象
// 它可以将store以slice的方式分割成为不同的部分，每个部分都会独立生成相对应的action和state对象
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUserName: (state, action) => {
      // immer赋予了直接修改state的能力
      state.name = action.payload.name;
    },
  },
  // extraReducers 字段让 slice 处理在别处定义的 actions，
  // 包括由 createAsyncThunk 或其他slice生成的actions。
  extraReducers: (builder) => {
    builder.addCase(fetchUserThunk.pending, (state) => {
      state.status = "loading";
    });
    builder.addCase(fetchUserThunk.fulfilled, (state, action) => {
      state.status = "complete";
      state.name = action.payload.name;
      state.id = action.payload.id;
    });
    builder.addCase(fetchUserThunk.rejected, (state) => {
      state.status = "error";
    });
  },
});

// 导出actions方法
export const { updateUserName } = userSlice.actions;
// 默认导出reducer
export default userSlice.reducer;
```

在 userSlice 里定义用户信息：ID、姓名、年龄以及加载状态。其中还有一个 updateUserName 的 action 和 fetchUserThunk 异步 thunk。

在 src/store/user/thunks.ts 里添加 fetchUserThunk 的实现：

```ts
// src/store/user/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchUser } from "apis/user";

// createAsyncThunk方法主要用来创建异步函数，创建完毕之后在reduce中进行处理，最后在业务代码中用dispatch进行调用
// （需要注意的是，在createSlice中，我们不可以用普通的reduce处理异步函数，必须使用  extraReducers来处理异步）
// 方法触发的时候会有三种状态：
// pending（进行中）、fulfilled（成功）、rejected（失败）
export const fetchUserThunk = createAsyncThunk(
  "user/fetchUserThunk",
  async () => {
    const response = await fetchUser();
    return response.data;
  }
);
```

这个 thunk 用到了 fetchUser 的 API 函数，所以要在 src/apis/user.ts 里添加这个函数的实现

由于要在页面中展示用户信息和加载状态，所以在 src/store/user/selectors.ts 里定义这两个 selector：

```ts
// src/store/user/selectors.ts
import { RootState } from "../index";

export const selectUser = (state: RootState) => {
  const { id, age, name } = state.user;

  return {
    id,
    age,
    name,
  };
};

export const selectUserFetchStatus = (state: RootState) => state.user.status;
```

最后在 src/store/index.ts 里把这个 userSlice 放到全局状态：

```ts
// src/store/index.ts
import userReducer from "./user/reducer";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// 整合全部reducers
export const reducer = combineReducers({
  user: userReducer,
});

// 创建全局store
const store = configureStore({
  reducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 导出全局的hooks，分别用于dispatch action和selector state
// 来自react-redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
```

在 src/components/User/index.tsx 里添加展示用户信息的组件：

```tsx
// src/components/User/index.tsx
import React, { FC } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchUserThunk } from "store/user/thunks";
import { selectUser, selectUserFetchStatus } from "store/user/selectors";
import { Button } from "antd";

const User: FC = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const status = useAppSelector(selectUserFetchStatus);

  const onClick = async () => {
    const res = await dispatch(fetchUserThunk());
    console.log("fetchUserThunk", res);
  };

  return (
    <div>
      <h2>用户信息</h2>

      {status === "loading" && <p>加载中...</p>}

      {user.id ? (
        <div>
          <p>ID：{user.id}</p>
          <p>姓名：{user.name}</p>
          <p>年龄：{user.age}</p>
        </div>
      ) : (
        <p>无用户信息</p>
      )}

      <Button onClick={onClick} type="primary">
        加载用户
      </Button>
    </div>
  );
};

export default User;
```

在 App.tsx 里使用它，最后在 index.tsx 入口里使用 Provider 来包裹整个 App：

```tsx
import store from "./store";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector("#root")
);
```

### 10.2 测试

涉及到数据流的测试，通常会**像真实用户那样去和组件交互，面向业务逻辑**，即**集成测试**，而忽略对于 redux/dva/dva/mobx 内容实现的测试

#### 10.2.1 集成测试思路

1. Mock Http 返回
2. 渲染 `<User />` 组件
3. 点击按钮拉取用户信息
4. 做断言

#### 10.2.2 测试代码

首先，我们来改造一下 React Tesitng Library 提供的 render 函数：

```tsx
// tests/testUtils/renderWithStore.tsx
import { configureStore } from "@reduxjs/toolkit";
import React, { FC } from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { RootState, reducer } from "store/index";
import { Provider } from "react-redux";

interface CustomRenderOptions extends RenderOptions {
  preloadedState?: RootState;
  store?: ReturnType<typeof configureStore>;
}

const renderWithStore = (
  ui: React.ReactElement,
  options: CustomRenderOptions
) => {
  // 获取自定义的 options，options 里带有 store 内容
  const {
    preloadedState = {},
    store = configureStore({ reducer, preloadedState }),
    ...renderOptions
  } = options;

  // 使用 Provider 包裹
  const Wrapper: FC = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
  };

  // 使用 RTL 的 render 函数
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};
export default renderWithStore;
```

自定义 render 的作用就是：创建一个使用 redux 的环境，用 `<Wrapper />` 包裹传入的业务组件，并且可以让我们决定当前 redux 的初始状态。

然后在 `tests/components/User/index.test.tsx` 使用自定义的 render 来渲染 `<User />` 组件：

```tsx
// 面向业务的集成测试
import { fireEvent, render, screen } from "@testing-library/react";
import User from "components/User";
import { rest } from "msw";
import React from "react";
import server from "../../../mockServer/server";
import renderWithStore from "../../../testUtils/renderWithStore";

// 初始化 Http 请求
const setupHttp = (name?: string, age?: number) => {
  server.use(
    rest.get("https://whatever/site/api/users", async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          id: "1",
          name: name || "Jack",
          age: age || 15,
        })
      );
    })
  );
};

describe("User", () => {
  it("点击可以正常获取用户列表", async () => {
    setupHttp("Mary", 10);
    renderWithStore(<User />, {
      preloadedState: {
        user: {
          id: "",
          name: "",
          age: 10,
          status: "",
        },
      },
    });
    // 此时没开始请求
    expect(screen.getByText("无用户信息")).toBeInTheDocument();

    // 开始请求
    fireEvent.click(screen.getByText("加载用户"));

    // 结束请求
    expect(await screen.findByText("ID：1")).toBeInTheDocument();
    expect(screen.getByText("姓名：Mary")).toBeInTheDocument();
    expect(screen.getByText("年龄：10")).toBeInTheDocument();

    expect(screen.queryByText("加载中...")).not.toBeInTheDocument();
  });
});
```

#### 10.2.3 `getBy*` vs `queryBy*` vs `findBy*`

- 当要断言元素是否存在时，使用 `getBy...`，因为找不到时，它会直接抛出错误来让测试失败
- 当要做异步逻辑，然后再获取元素时，使用 `await findBy...`，因为它会不断地寻找元素
- 上面两种情况都不满足时，可以使用 `queryBy...` 这个 API，只查一次，且不会失败报错

#### 10.2.4 单元测试思路

- 对于非常复杂的 action 以及 selector 时，单测是个不错的选择
- 这里只给出测试思路：
  1. 先写 selector 的单测。由于是纯函数，所以这两个单测比较简单
  2. 异步 action 单测：
     1. 使用 msw Mock Http 的返回
     2. 使用 redux-mock-store 里的 configureStore 创建一个假 store
     3. 在假 store 里引入 redux-thunk 中间件
     4. 最后对 data.payload 做断言

## 11 React Hook 测试

### 11.1 需求与实现

在 src/hooks/useCounter.ts 添加：

```ts
// src/hooks/useCounter.ts
import { useState } from "react";

export interface Options {
  min?: number;
  max?: number;
}

export type ValueParam = number | ((c: number) => number);

function getTargetValue(val: number, options: Options = {}) {
  const { min, max } = options;
  let target = val;
  if (typeof max === "number") {
    target = Math.min(max, target);
  }
  if (typeof min === "number") {
    target = Math.max(min, target);
  }
  return target;
}

function useCounter(initialValue = 0, options: Options = {}) {
  const { min, max } = options;

  const [current, setCurrent] = useState(() => {
    return getTargetValue(initialValue, {
      min,
      max,
    });
  });

  const setValue = (value: ValueParam) => {
    setCurrent((c) => {
      const target = typeof value === "number" ? value : value(c);
      return getTargetValue(target, {
        max,
        min,
      });
    });
  };

  const inc = (delta = 1) => {
    setValue((c) => c + delta);
  };

  const dec = (delta = 1) => {
    setValue((c) => c - delta);
  };

  const set = (value: ValueParam) => {
    setValue(value);
  };

  const reset = () => {
    setValue(initialValue);
  };

  return [
    current,
    {
      inc,
      dec,
      set,
      reset,
    },
  ] as const;
}

export default useCounter;
```

### 11.2 集成测试

#### 11.2.1 组件测试

由于 React 规定只有在组件中才能使用 Hooks，所以在测试前可以**先构造出一个组件，通过按钮触发点击事件，测试 ui 的值是否发生变化**

安装 `@testing-library/user-event`，用于处理点击事件：

```bash
pnpm add -D @testing-library/user-event@14.1.0
```

添加 `tests/hooks/useCounter/TestComponent.test.tsx`：

```tsx
import useCounter from "hooks/useCounter";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// 测试组件
const UseCounterTest = () => {
  const [counter, { inc, set, dec, reset }] = useCounter(0);
  return (
    <section>
      <div>Counter: {counter}</div>
      <button onClick={() => inc(1)}>inc(1)</button>
      <button onClick={() => dec(1)}>dec(1)</button>
      <button onClick={() => set(10)}>set(10)</button>
      <button onClick={reset}>reset()</button>
    </section>
  );
};

describe("useCounter", () => {
  it("可以做加法", async () => {
    render(<UseCounterTest />);

    const incBtn = screen.getByText("inc(1)");

    await userEvent.click(incBtn);

    expect(screen.getByText("Counter: 1")).toBeInTheDocument();
  });

  it("可以做减法", async () => {
    render(<UseCounterTest />);

    const decBtn = screen.getByText("dec(1)");

    await userEvent.click(decBtn);

    expect(screen.getByText("Counter: -1")).toBeInTheDocument();
  });

  it("可以设置值", async () => {
    render(<UseCounterTest />);

    const setBtn = screen.getByText("set(10)");

    await userEvent.click(setBtn);

    expect(screen.getByText("Counter: 10")).toBeInTheDocument();
  });

  it("可以重置值", async () => {
    render(<UseCounterTest />);

    const incBtn = screen.getByText("inc(1)");
    const resetBtn = screen.getByText("reset()");

    await userEvent.click(incBtn);
    await userEvent.click(resetBtn);

    expect(screen.getByText("Counter: 0")).toBeInTheDocument();
  });
});
```

#### 11.2.2 setup

通过绑定事件并手动触发，感觉还是有些麻烦，工作量较大

我们沿袭上面的思路，**通过 render 组件来为 hooks 提供运行环境**
这次我们将重点放在 **hooks 返回值**（函数）的测试上
创建 setup 函数 通过 act 调用其方法 期待结果即可

这样能够避免组件交互，且是对内部功能函数的直接调用并测试

注意由于 inc 里面的 setState 是一个异步逻辑，因此我们可以使用 @testing-library/react 提供的 act 里调用它。**act 可以确保回调里的异步逻辑走完再执行后续代码**

具体代码：

```tsx
// tests/hooks/useCounter/setupTestComponent.test.tsx
import useCounter from "hooks/useCounter";
import { act, render } from "@testing-library/react";
import React from "react";

const setup = (initialNumber: number) => {
  const returnVal = {};

  const UseCounterTest = () => {
    const [counter, utils] = useCounter(initialNumber);

    Object.assign(returnVal, {
      counter,
      utils,
    });
    // 由于只是初始化React组件环境
    // 无需返回dom
    return null;
  };

  render(<UseCounterTest />);

  return returnVal;
};

describe("useCounter", () => {
  it("可以做加法", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.inc(1);
    });

    expect(useCounterData.counter).toEqual(1);
  });

  it("可以做减法", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.dec(1);
    });

    expect(useCounterData.counter).toEqual(-1);
  });

  it("可以设置值", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.set(10);
    });

    expect(useCounterData.counter).toEqual(10);
  });

  it("可以重置值", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.inc(1);
      useCounterData.utils.reset();
    });

    expect(useCounterData.counter).toEqual(0);
  });
});
```

#### 11.2.3 renderHook

基于这样的想法，@testing-library/react-hooks 把上面的步骤封装成了一个公共函数 renderHook：

```bash
pnpm add -D @testing-library/react-hooks@8.0.0
```

然后，在 renderHook 回调中使用 useCounter：

```tsx
// tests/hooks/useCounter/renderHook.test.ts
import { renderHook } from "@testing-library/react-hooks";
import useCounter from "hooks/useCounter";
import { act } from "@testing-library/react";

describe("useCounter", () => {
  it("可以做加法", () => {
    /** renderHook返回值：
    {
      result: { all: [Getter], current: [Getter], error: [Getter] },
      rerender: [Function: rerenderHook],
      unmount: [Function: unmountHook],
      waitFor: [AsyncFunction: waitFor],
      waitForValueToChange: [AsyncFunction: waitForValueToChange],
      waitForNextUpdate: [AsyncFunction: waitForNextUpdate]
    }
    */
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      // 正常情况下，result.current就是hook的全部返回值
      // all的话就是hook返回值外面再包上一个[]
      result.current[1].inc(1);
    });

    expect(result.current[0]).toEqual(1);
  });

  it("可以做减法", () => {
    const { result } = renderHook(() => useCounter(1));
    act(() => {
      result.current[1].dec(1);
    });
    expect(result.current[0]).toEqual(0);
  });
  it("可以设置值", () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current[1].set(2);
    });
    expect(result.current[0]).toEqual(2);
  });
  it("可以重置值", () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current[1].inc(2);
      result.current[1].dec(1);
      result.current[1].reset();
    });
    expect(result.current[0]).toEqual(0);
  });
});
```

### 11.3 总结

总结一下 React Hook 的测试方法：

- 声明 setup，在里面通过渲染测试组件为 React Hook 提供 React 组件环境
- 把 React Hook 的返回结果返回给每个用例
- 每个用例从 setup 返回拿到 React Hook 的返回值，并对其进行测试

通过这一章，我们再次看到了集成测试的强大作用 —— 让测试忽略实现细节，只关注功能是否完好。

## 12 Jest 性能优化

Jest 执行测试的过程有 3 个地方比较耗性能：

- 生成虚拟文件系统。 在执行第一个测试会很慢
- 多线程。 生成新线程耗费的资源，不过，不同机器的效果会不一致
- 文件转译。 Jest 会在执行到该文件再对它进行转译

解决的方法有：

- 无解，有条件的话拆解项目吧
- 具体情况具体分析，要看机器的执行情况，多线程快就用多线程，单线程快就用单线程
- 使用 esbuild-jest、 @swc/jest 等其它高效的转译工具来做转译

## 13 自动化测试

### 13.1 Github Actions

在根目录添加 `.github/workflows/ci.yml`：

```yml
# 指定工作流程的名称
name: CI-learning
# 指定此工作流程的触发事件Event（push、pull-request）
on:
  push:
    # 监听main分支的push事件
    branches: master
jobs:
  #指定job名称
  CI:
    # 指定该job在最新版本的ubuntu linux的runner上运行
    # runs-on: ubuntu-latest
    runs-on: macos-latest
    # 此job的工作步骤
    steps:
      # 首先运行actions/checkout@v3操作，操作一般用uses来调用
      # 拉取代码到runner
      - name: Checkout repository
        uses: actions/checkout@v3
      # 给当前环境下载node，并指定版本为16.x
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "16.16.0"
      # 安装pnpm
      - name: Installing Pnpm
        run: npm i -g pnpm
      # 安装依赖
      - name: Installing Dependencies
        run: pnpm install
      # 运行自动化测试
      - name: Running Test
        run: pnpm run test
```

### 13.2 Coveralls

> https://coveralls.io/

Coveralls 能够读取 Jest 生成的 `lcov.info` 覆盖率文件，并以可视化的方法展示出来，不仅能做预警，还能实时了解整体测试覆盖情况。

首先在 Coveralls 官网 (opens new window)用 Github 账号登入，添加你的 Github 项目即可。

github action 最后加上如下指令即可

```yml
# 使用 Coveralls 组件显示可视化测试报告
- name: Coveralls
  uses: coverallsapp/github-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```
