import { useState } from "react";

export interface Options {
  min?: number;
  max?: number;
}
export type ValueParam = number | ((c: number) => number);

const getTargetValue = (val: number, options: Options = {}) => {
  const { min, max } = options;
  let target = val;
  if (typeof max === "number") {
    target = Math.min(max, target);
  }
  if (typeof min === "number") {
    target = Math.max(min, target);
  }
  return target;
};

const useCounter = (initialValue = 0, options: Options = {}) => {
  const { min, max } = options;
  const [current, setCurrent] = useState(() => {
    return getTargetValue(initialValue, { min, max });
  });
  const setValue = (value: ValueParam) => {
    setCurrent((c) => {
      const target = typeof value === "number" ? value : value(c);
      return getTargetValue(target, { max, min });
    });
  };
  // increase
  const inc = (delta = 1) => setValue((c) => c + delta);
  // decrease
  const dec = (delta = 1) => setValue((c) => c - delta);
  // set value
  const set = (value: ValueParam) => setValue(value);
  // reset to init
  const reset = () => setValue(initialValue);
  return [
    current,
    {
      inc,
      dec,
      set,
      reset,
    },
  ] as const;
  // as const 可以解决找不到这些属性的问题
};
export default useCounter;
