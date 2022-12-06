// 我们沿袭plan1的思路，通过render组件来为hooks提供运行环境
// 这次我们将重点放在hooks返回值（函数）的测试上
// 创建setup函数 通过act调用其方法 期待结果即可

import { render } from "@testing-library/react";
import useCounter from "hooks/useCounter";
import React from "react";
import { act } from "react-dom/test-utils";

const setup = (initialNumber: number) => {
  const returnVal = {};
  const UseCounterTestComponent = () => {
    const [counter, utils] = useCounter(initialNumber);
    Object.assign(returnVal, {
      counter,
      utils,
    });
    // 由于只是初始化React组件环境
    // 无需返回dom
    return null;
  };
  render(<UseCounterTestComponent />);
  return returnVal;
};

describe("useCounter", () => {
  it("可以做加法", async () => {
    const useCounterData: any = setup(0);
    // 由于 inc 里面的 setState 是一个异步逻辑
    // 因此我们可以使用 @testing-library / react 提供的 act 里调用它。
    // act 可以确保回调里的异步逻辑走完再执行后续代码
    act(() => {
      useCounterData.utils.inc(1);
    });
    expect(useCounterData.counter).toEqual(1);
  });
  it("可以做减法", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.dec(1);
    });

    expect(useCounterData.counter).toEqual(-1);
  });

  it("可以设置值", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.set(10);
    });

    expect(useCounterData.counter).toEqual(10);
  });

  it("可以重置值", async () => {
    const useCounterData: any = setup(0);

    act(() => {
      useCounterData.utils.inc(1);
      useCounterData.utils.reset();
    });

    expect(useCounterData.counter).toEqual(0);
  });
});
