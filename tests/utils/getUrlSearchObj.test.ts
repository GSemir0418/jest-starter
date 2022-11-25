import getUrlSearchObj from "utils/getUrlSearchObj";

describe("getUrlSearchObj", () => {
  it("可以獲取url並讀取searchObj", () => {
    // 在jsdom環境中不允許直接修改href屬性
    // 詳見jest-setup.ts
    // window.location.href = "https://www.baidu.com?a=1&b=2";
    window.location.assign("https://www.baidu.com?a=1&b=2");

    expect(window.location.search).toEqual("?a=1&b=2");
    expect(getUrlSearchObj()).toEqual({ a: "1", b: "2" });
  });
  it("空參數返回空對象", () => {
    window.location.assign("https://www.baidu.com");

    expect(window.location.search).toEqual("");
    expect(getUrlSearchObj()).toEqual({});
  });
});
