import sleep from "utils/sleep";

describe("sleep", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("可以睡眠1000ms", async () => {
    // 正常测试思路：
    // // 构造假函数
    // const callback = jest.fn();
    // // 执行sleep
    // sleep(1000).then(() => callback());
    // // 此时期待callback没有被执行
    // expect(callback).not.toHaveBeenCalled();
    // // 运行全部定时器
    // jest.runAllTimers();
    // // 此时期待callback被执行了一次
    // expect(callback).toBeCalled();
    // expect(callback).toHaveBeenCalledTimes(1);

    // 由于jest的FakeTime也是一个Message Quene
    // setTimeout时会把Message记录到jest自己的Message Quene中
    // 执行runAllTimers方法会清空Message Quene内全部的Message
    // 此时.then后面的"callback执行"这部分代码会被放入Job Message
    // 直到测试代码最后一行，callback也没有机会得到调用
    // 因此会报 call没有执行的测试错误

    // 解决方案：
    const callback = jest.fn();
    const act = async (callback: () => void) => {
      await sleep(1000);
      callback();
    };

    // 利用promise变量存储sleep返回的Promise
    const promise = act(callback);
    // mockCallback 还未调用
    expect(callback).not.toBeCalled();
    // 清算 Jest Message Queue 的回调，其中会执行 setTimeout 里的 resolve 函数
    // 就会把callback()放入Job Quene
    jest.runAllTimers();
    // 执行 callback 内容
    // 利用await将expec同步代码延后至promise被resolve之后执行
    await promise;
    // mockCallback 已调用
    expect(callback).toBeCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
