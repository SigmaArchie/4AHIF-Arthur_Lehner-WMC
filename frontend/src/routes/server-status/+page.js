const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function load({ fetch }) {
  const response = await fetch(`${API}/`);
  const message = await response.text();

  return {
    message
  };
}