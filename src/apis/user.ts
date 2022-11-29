import axios from "axios";

export type UserRoleType = "user" | "admin";
export interface GetUserRoleRes {
  userType: UserRoleType;
}

// 获取用户角色
export const getUserRole = async () => {
  return axios.get<GetUserRoleRes>("https://whatever/site/api/role");
};
