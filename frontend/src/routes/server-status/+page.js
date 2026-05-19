export async function load({ fetch }) {
  const response = await fetch('http://localhost:3000/');
  const message = await response.text();

  return {
    message
  };
}