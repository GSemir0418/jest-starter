import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchUser } from "apis/user";

// createAsyncThunk方法主要用来创建异步函数，创建完毕之后在reduce中进行处理，最后在业务代码中用dispatch进行调用
// （需要注意的是，在createSlice中，我们不可以用普通的reduce处理异步函数，必须使用  extraReducers来处理异步）
// 方法触发的时候会有三种状态：
// pending（进行中）、fulfilled（成功）、rejected（失败）
export const fetchUserThunk = createAsyncThunk(
  "user/fetchUserThunk",
  async () => {
    const response = await fetchUser();
    return response.data;
  }
);
