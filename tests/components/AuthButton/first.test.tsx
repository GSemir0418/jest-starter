import { render, screen } from "@testing-library/react";
import AuthButton from "components/AuthButton";
import React from "react";

describe("AuthButton", () => {
  it("可以正常显示", () => {
    render(<AuthButton>登录</AuthButton>);

    expect(screen.getByText("登录")).toBeDefined();
  });
});

// 这里直接测试会报错：Jest encounter an unexpected token
// 我们一直采用tsc转译typeScript tsc看不懂.less 导致报错
// ts-jest 把 jest 和 tsc 联系起来
// ts-loader把 webpack 和 tsc 联系起来
// webpack仅作为脚手架 跑项目用
// tsc仅负责转译ts
// jest仅负责运行测试
// 测试框架是另一套生态
// 除了less文件，我们还要对非JS静态资源（不会影响测试）做转译，比如jpg svg png等
// 选择jest-transform-stub@2.0.0
