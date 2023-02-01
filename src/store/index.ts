import userReducer from "./user/reducer";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 整合全部reducers
export const reducer = combineReducers({
  user: userReducer,
});

// 创建全局store
const store = configureStore({
  reducer,
});

// 导出全局的hooks，分别用于dispatch action和selector state
// 来自react-redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
