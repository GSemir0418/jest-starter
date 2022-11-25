import getUrlSearchObj from "utils/getUrlSearchObj";

describe("getUrlSearchObj", () => {
  it("可以獲取url並讀取searchObj", () => {
    window.location.href = "https://www.baidu.com?a=1&b=2";

    expect(window.location.search).toEqual("?a=1&b=2");
    expect(getUrlSearchObj()).toEqual({ a: "1", b: "2" });
  });
  it("空參數返回空對象", () => {
    window.location.href = "https://www.baidu.com";

    expect(window.location.search).toEqual("");
    expect(getUrlSearchObj()).toEqual({});
  });
});
