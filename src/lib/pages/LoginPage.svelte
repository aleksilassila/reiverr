<script lang="ts">
	import { getReiverrApiClient } from '../apis/reiverr/reiverr-api';
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';

	let name: string = 'test';
	let password: string = 'test';
	let error: string | undefined = undefined;

	let input0: HTMLInputElement;
	let input1: HTMLInputElement;
	let input2: HTMLInputElement;

	function handleLogin() {
		getReiverrApiClient()
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
					error = 'Error occurred: ' + res.error.message;
				} else {
					const token = res.data.accessToken;
					appState.setToken(token);
					window.location.reload();
				}
			})
			.catch((err: Error) => {
				error = err.name + ': ' + err.message;
			});
	}
</script>

<Container class="flex flex-col" focusOnMount>
	{#if error}
		<div class="text-red-300">{error}</div>
	{/if}

	<div>
		Server:
		<Container on:click={() => input0?.focus()}>
			<input
				class="bg-stone-900"
				type="text"
				value={$appState.serverBaseUrl}
				on:change={(e) => appState.setBaseUrl(e?.target?.value)}
				bind:this={input0}
			/>
		</Container>
	</div>

	<div>
		Name:
		<Container on:click={() => input1?.focus()}>
			<input class="bg-stone-900" type="text" bind:value={name} bind:this={input1} />
		</Container>
	</div>

	<div>
		Password:
		<Container on:click={() => input2?.focus()}>
			<input class="bg-stone-900" type="password" bind:value={password} bind:this={input2} />
		</Container>
	</div>
	<Container on:click={handleLogin}>Submit</Container>
</Container>
