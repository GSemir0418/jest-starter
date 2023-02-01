import { createSlice } from "@reduxjs/toolkit";
import { fetchUserThunk } from "./thunks";

const initialState = {
  id: "",
  name: "",
  age: 0,
  status: "",
};
// 该函数接收一个初始化state对象，和一个reducer对象
// 它可以将store以slice的方式分割成为不同的部分，每个部分都会独立生成相对应的action和state对象
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUserName: (state, action) => {
      // immer赋予了直接修改state的能力
      state.name = action.payload.name;
    },
  },
  // extraReducers 字段让 slice 处理在别处定义的 actions， 
  // 包括由 createAsyncThunk 或其他slice生成的actions。
  extraReducers: (builder) => {
    builder.addCase(fetchUserThunk.pending, (state) => {
      state.status = "loading";
    });
    builder.addCase(fetchUserThunk.fulfilled, (state, action) => {
      state.status = "complete";
      state.name = action.payload.name;
      state.id = action.payload.id;
    });
    builder.addCase(fetchUserThunk.rejected, (state) => {
      state.status = "error";
    });
  },
});

// 导出actions方法
export const { updateUserName } = userSlice.actions;
// 默认导出reducer
export default userSlice.reducer;
