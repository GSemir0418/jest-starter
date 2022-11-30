import { rest } from "msw";
// 暂时没用上，因为每个测试都会mock自己的api
const handlers = [
  rest.get("https://whatever/site/api/role", async (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ userType: "user" }))
  ),
];
export default handlers;
