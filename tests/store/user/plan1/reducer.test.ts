import { rest } from "msw";
import reducer, { updateUserName } from "store/user/reducer";
import server from "../../../mockServer/server";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { fetchUserThunk } from "store/user/thunks";
// 初始化http函数
const setupHttp = (name?: string, age?: number) => {
  server.use(
    rest.get("https://whatever/site/api/users", async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          id: "1",
          name: name || "Jack",
          age: age || 18,
        })
      );
    })
  );
};
describe("reducer", () => {
  describe("测试reducer", () => {
    // reducer 本身也是纯函数，它的作用就是改变数据状态
    // 所以这里我们在第一个参数传入当前状态，在第二个参数传入 action， 最后 expect 一下返回的新状态 currentState 就完成了
    describe("updateUserName", () => {
      it("可以更新用户姓名", () => {
        const currentState = reducer(
          { id: "", name: "", age: 0, status: "" },
          updateUserName({ name: "hello" })
        );
        expect(currentState.name).toEqual("hello");
      });
    });
    // fetchUserThunk 的测试涉及到 redux-thunk 中间件、API 异步函数还有 Http 请求，所以我们不能直接调用 reducer 来做测试
    // 使用 msw Mock Http 的返回
    // 使用 redux-mock-store 里的 configureStore 创建一个假 store
    // 在假 store 里引入 redux-thunk 中间件
    // 最后对 data.payload 做了断言
    describe("fetchUserThunk", () => {
      it("可以获取用户", async () => {
        // 1.Mock Http 返回
        setupHttp("Mary", 10);

        // 2.Mock redux 的 store
        const middlewares = [thunk];
        const mockStore = configureStore(middlewares);
        const store = mockStore({
          id: "",
          name: "",
          age: 0,
          status: "",
        });

        // 开始 dispatch
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const data = await store.dispatch(fetchUserThunk());
        console.log("===============");
        console.log(data);
        expect(data.payload).toEqual({
          id: "1",
          name: "Mary",
          age: 10,
        });

        // 失败，因为 redux-mock-store 只能测 action 部分
        // 详情：https://github.com/reduxjs/redux-mock-store/issues/71
        // expect(store.getState()).toEqual({
        //   id: "1",
        //   name: "Mary",
        //   age: 10,
        //   status: "complete",
        // });
      });
    });
  });
});
