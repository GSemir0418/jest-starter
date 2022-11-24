import myStorage from "utils/myStorage";

describe("myStorage", () => {
  it("可以set", () => {
    myStorage.set("newKey", "hello");
    expect(localStorage.getItem("my-app-newKey")).toEqual("hello");
  });
  it("可以get", () => {
    localStorage.setItem("my-app-newKey", "hello");
    expect(myStorage.get("newKey")).toEqual("hello");
  });
});
