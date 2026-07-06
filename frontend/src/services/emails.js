import api from "./api";

function authConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

export function sendEmails(data) {
  return api.post("/emails/send", data, authConfig());
}

export function getEmailHistory(params = {}) {
  return api.get("/emails/history", {
    ...authConfig(),
    params,
  });
}
