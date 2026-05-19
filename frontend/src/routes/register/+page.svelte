<script>
  let username = $state('');
  let password = $state('');
  let message = $state('');

  async function register() {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    message = data.message || data.error;
  }
</script>

<h1 class="text-3xl font-bold mb-4">Register</h1>

<div class="flex flex-col gap-4 max-w-sm">
  <input
    bind:value={username}
    type="text"
    placeholder="Username"
    class="border p-2 rounded"
  />

  <input
    bind:value={password}
    type="password"
    placeholder="Password"
    class="border p-2 rounded"
  />

  <button
    onclick={register}
    class="bg-blue-500 text-white p-2 rounded"
  >
    Register
  </button>

  <p>{message}</p>
</div>