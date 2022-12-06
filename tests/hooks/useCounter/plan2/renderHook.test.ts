// 基于初始化hooks运行环境的思路
// 可以使用@testing-library/react-hooks提供的renderHook方法
// 实际上就是我们之前方法的封装

import useCounter from "hooks/useCounter";
import { renderHook } from "@testing-library/react-hooks";
import { act } from "@testing-library/react";

describe("useCounter", () => {
  it("可以做加法", () => {
    /** renderHook返回值：
    {
      result: { all: [Getter], current: [Getter], error: [Getter] },
      rerender: [Function: rerenderHook],
      unmount: [Function: unmountHook],
      waitFor: [AsyncFunction: waitFor],
      waitForValueToChange: [AsyncFunction: waitForValueToChange],
      waitForNextUpdate: [AsyncFunction: waitForNextUpdate]
    }
    */
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      // 正常情况下，result.current就是hook的全部返回值
      // all的话就是hook返回值外面再包上一个[]
      result.current[1].inc(1);
    });

    expect(result.current[0]).toEqual(1);
  });
  it("可以做减法", () => {
    const { result } = renderHook(() => useCounter(1));
    act(() => {
      result.current[1].dec(1);
    });
    expect(result.current[0]).toEqual(0);
  });
  it("可以设置值", () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current[1].set(2);
    });
    expect(result.current[0]).toEqual(2);
  });
  it("可以重置值", () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current[1].inc(2);
      result.current[1].dec(1);
      result.current[1].reset();
    });
    expect(result.current[0]).toEqual(0);
  });
});
