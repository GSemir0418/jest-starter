import after1000ms from "utils/after1000ms";

describe("after1000ms", () => {
  // 方案一 执行。。等待。。
  // 这样还要等1000ms后测试代码才执行 no no no
  //   it("可以在1000ms后自动执行函数", (done) => {
  //     after1000ms(() => {
  //       expect("");
  //       done();
  //     });
  //   });
  // 方案二 useFakeTimers 利用jest mock timers
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("可以在 1000ms 后自动执行函数", () => {
    // 通过spyon监听setTimeout方法
    jest.spyOn(global, "setTimeout");
    // 构造一个假函数
    const callback = jest.fn();
    // 期待此时setTimeout没有被调用
    expect(callback).not.toHaveBeenCalled();
    // 执行测试函数
    after1000ms(callback);
    // 快进时间。。。。。（将所有定时器方法快进到结束）
    jest.runAllTimers();
    // 期待此时callback被调用
    expect(callback).toHaveBeenCalled();
    // 期待此时setTimeout被执行一次
    expect(setTimeout).toHaveBeenCalledTimes(1);
    // 期待此时setTimeout执行时的参数分别是(一个函数)及(1000) 。。有必要吗？
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
  });
});
