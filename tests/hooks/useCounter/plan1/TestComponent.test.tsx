// 由于react的hooks只允许在react组件中才能使用
// 因此第一种测试方案就是写一个组件，render出来
// 然后通过触发事件调用hooks返回的结果，来测试hooks
// 安装@testing-library/user-event@14.1.0

import { render, screen } from "@testing-library/react";
import useCounter from "hooks/useCounter";
import userEvent from "@testing-library/user-event";
import React from "react";

// 测试组件
const UseCounterTest = () => {
  const [counter, { inc, dec, set, reset }] = useCounter(0);
  return (
    <section>
      <div>Counter: {counter}</div>
      <button onClick={() => inc(1)}>inc(1)</button>
      <button onClick={() => dec(1)}>dec(1)</button>
      <button onClick={() => set(10)}>set(10)</button>
      <button onClick={() => reset()}>reset</button>
    </section>
  );
};

describe("useCounter", () => {
  it("可以做加法", async () => {
    render(<UseCounterTest />);
    const incBtn = screen.getByText("inc(1)");
    await userEvent.click(incBtn);
    expect(screen.getByText("Counter: 1")).toBeInTheDocument();
  });
  it("可以做减法", async () => {
    render(<UseCounterTest />);
    const decBtn = screen.getByText("dec(1)");
    await userEvent.click(decBtn);
    expect(screen.getByText("Counter: -1")).toBeInTheDocument();
  });
  it("可以设置值", async () => {
    render(<UseCounterTest />);
    const setBtn = screen.getByText("set(10)");
    await userEvent.click(setBtn);
    expect(screen.getByText("Counter: 10")).toBeInTheDocument();
  });
  it("可以重置值", async () => {
    render(<UseCounterTest />);
    const incBtn = screen.getByText("inc(1)");
    const resetBtn = screen.getByText("reset");
    await userEvent.click(incBtn);
    await userEvent.click(resetBtn);
    expect(screen.getByText("Counter: 0")).toBeInTheDocument();
  });
});
