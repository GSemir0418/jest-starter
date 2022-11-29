import axios from "axios";

export type UserRoleType = "user" | "admin";
export interface GetUserRoleRes {
  userType: UserRoleType;
}

// 获取用户角色
export const getUserRole = async () => {
  return axios.get<GetUserRoleRes>("https://whatever/site/api/role");
};

// 获取用户列表
export interface FetchUserRes {
  id: string;
  name: string;
}

export const fetchUser = async () => {
  return axios.get<FetchUserRes>("https://whatever/site/api/users");
};
