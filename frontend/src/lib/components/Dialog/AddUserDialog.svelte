<script lang="ts">
	import Dialog from './Dialog.svelte';
	import Login from '../LoginForm.svelte';
	import { navigate } from '../StackRouter/stack-router.store';
</script>

<Dialog let:close>
	<Login
		on:login={() => {
			close();
			navigate('/', { refresh: true });
		}}
	/>
</Dialog>
