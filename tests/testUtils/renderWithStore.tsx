import { configureStore } from "@reduxjs/toolkit";
import React, { FC } from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { RootState, reducer } from "store/index";
import { Provider } from "react-redux";

interface CustomRenderOptions extends RenderOptions {
  preloadedState?: RootState;
  store?: ReturnType<typeof configureStore>;
}

const renderWithStore = (
  ui: React.ReactElement,
  options: CustomRenderOptions
) => {
  // 获取自定义的 options，options 里带有 store 内容
  const {
    preloadedState = {},
    store = configureStore({ reducer, preloadedState }),
    ...renderOptions
  } = options;

  // 使用 Provider 包裹
  const Wrapper: FC = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
  };

  // 使用 RTL 的 render 函数
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};
export default renderWithStore;
