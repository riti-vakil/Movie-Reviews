const baseUrl = "https://api.themoviedb.org/3/";
const key = "cbb95a605611228721543c6fd2018422";

const getUrl = (endpoint, params) => {
  const qs = new URLSearchParams(params);

  return `${baseUrl}${endpoint}?api_key=${key}&${qs}`;
};

export default { getUrl };