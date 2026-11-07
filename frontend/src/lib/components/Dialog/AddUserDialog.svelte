<script lang="ts">
	import Dialog from './Dialog.svelte';
	import Login from '../LoginForm.svelte';
	import { navigate } from '../StackRouter/stack-router.store';
</script>

<Dialog>
	{#snippet children({ close })}
		<Login
			onLogin={() => {
				close();
				navigate('/', { refresh: true });
			}}
		/>
	{/snippet}
</Dialog>
