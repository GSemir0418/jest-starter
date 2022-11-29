// 使用 Jest 和 Spy 並擴展 expect 來 Mock 'window.location'
import "jest-location-mock";
// 提供关于DOM的更多Matcher
import "@testing-library/jest-dom";
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
// 给测试环境mock一个全局localStorage实现;
// Object.defineProperty(global, "localStorage", {
//   value: {
//     store: {} as Record<string, string>,
//     setItem(key: string, value: string) {
//       this.store[key] = value;
//     },
//     getItem(key: string) {
//       return this.store[key];
//     },
//     removeItem(key: string) {
//       delete this.store[key];
//     },
//     clear() {
//       this.store = {};
//     },
//   },
//   configurable: true,
// });
