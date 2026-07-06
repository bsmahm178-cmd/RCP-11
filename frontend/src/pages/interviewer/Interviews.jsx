export function getMyInterviews() {
  return api.get(
    "/interviewer/interviews",
    authConfig()
  );
}

export function submitInterview(interviewId, data) {
  return api.patch(
    `/interviews/${interviewId}/submit`,
    data,
    authConfig()
  );
}