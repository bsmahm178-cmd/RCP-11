import api from "./api";

export function getDashboardData() {
  return api.get("/dashboard");
}

export function uploadDashboardExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/import-excel", formData);
}
