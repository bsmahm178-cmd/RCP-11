import api from "./api";

export async function loginUser(loginData) {
  return api.post("/auth/login", {
    first_name: loginData.first_name,
    password: loginData.password,
    role: loginData.role,
  });
}

export async function registerUser(registerData) {
  return api.post("/auth/register", {
    first_name: registerData.first_name,
    last_name: registerData.last_name,
    email: registerData.email,
    password: registerData.password,
    role: registerData.role,
  });
}