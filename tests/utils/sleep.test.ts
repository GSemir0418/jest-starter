import sleep from "utils/sleep";

describe("sleep", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("可以睡眠1000ms", async () => {
    // 构造假函数
    const callback = jest.fn();
    // 执行sleep
    sleep(1000).then(() => callback());
    // 此时期待callback没有被执行
    expect(callback).not.toHaveBeenCalled();
    // 运行全部定时器
    jest.runAllTimers();
    // 此时期待callback被执行了一次
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
