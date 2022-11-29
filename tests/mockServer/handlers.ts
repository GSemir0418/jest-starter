import { rest } from "msw";

const handlers = [
  rest.get("https://whatever/site/api/role", async (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ userType: "user" }))
  ),
];
export default handlers;
