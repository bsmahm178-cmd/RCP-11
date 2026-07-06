import api from "./api";

function authConfig() {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function getFinalShortlist() {
  return api.get("/final-shortlist", {
    ...authConfig(),
    params: {
      page: 1,
      page_size: 500,
    },
  });
}

export function updateFinalShortlist(
  itemId,
  data
) {
  return api.patch(
    `/final-shortlist/${itemId}`,
    data,
    authConfig()
  );
}

