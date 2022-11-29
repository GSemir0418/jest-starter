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
