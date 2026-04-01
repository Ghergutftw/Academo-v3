// Detectează automat serverul și setează URL-ul API corect
const getApiUrl = () => {
  const host = window.location.host;

  // Ubuntu VM pe port 8080
  if (host.includes(':8080')) return 'http://localhost:8080/student-management-backend/api';

  // WAMP local
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost/Ghergut/student-management-backend/api';

  // Server production (default)
  return `http://${host}/student-management-backend/api`;
};

export const environment = {
  apiUrl: getApiUrl()
}
