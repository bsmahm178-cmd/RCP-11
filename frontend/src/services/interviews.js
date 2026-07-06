import api from "./api";

function authConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };
}

export function getInterviews(params = {}) {
  return api.get("/interviews", {
    ...authConfig(),
    params,
  });
}

export function getInterviewers() {
  return api.get(
    "/users/interviewers",
    authConfig()
  );
}

export function assignInterviewer(
  interviewId,
  interviewerEmail
) {
  return api.patch(
    `/interviews/${interviewId}/assign`,
    {
      interviewer_email: interviewerEmail,
    },
    authConfig()
  );
}

export function getMyInterviews() {
  return api.get(
    "/interviewer/interviews",
    authConfig()
  );
}

export function submitInterview(
  interviewId,
  data
) {
  return api.patch(
    `/interviews/${interviewId}/submit`,
    data,
    authConfig()
  );
}

export function setFinalDecision(
  interviewId,
  decision
) {
  return api.patch(
    `/interviews/${interviewId}/decision`,
    {
      decision,
    },
    authConfig()
  );
}

