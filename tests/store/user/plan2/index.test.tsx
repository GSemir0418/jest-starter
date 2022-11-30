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

//  getBy... | findBy... | queryBy...
// 当要断言元素是否存在时，使用 getBy...，因为找不到时，它会直接抛出错误来让测试失败
// 当要做异步逻辑，然后再获取元素时，使用 await findBy...，因为它会不断地寻找元素
// 上面两种情况都不满足时，可以使用 queryBy... 这个 API
