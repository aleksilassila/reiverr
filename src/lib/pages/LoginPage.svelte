<script lang="ts">
	import { reiverrApi } from '../apis/reiverr/reiverrApi';
	import { authenticationToken } from '../stores/localstorage.store';

	let name: string;
	let password: string;
	let error: string | undefined = undefined;

	function handleLogin() {
		reiverrApi
			.getApi()
			.POST('/auth', {
				body: {
					name,
					password
				}
			})
			.then((res) => {
				if (res.error?.statusCode === 401) {
					error = 'Invalid credentials. Please try again.';
				} else if (res.error) {
					error = res.error.message;
				} else {
					const token = res.data.accessToken;
					authenticationToken.set(token);
					window.location.reload();
				}
			})
			.catch((err: Error) => {
				error = err.name + ': ' + err.message;
			});
	}
</script>

<div class="flex flex-col">
	{#if error}
		<div class="text-red-300">{error}</div>
	{/if}

	<div>
		Name: <input class="bg-stone-900" type="text" bind:value={name} />
	</div>

	<div>
		Password: <input class="bg-stone-900" type="password" bind:value={password} />
	</div>
	<button on:click={handleLogin}>Submit</button>
</div>
