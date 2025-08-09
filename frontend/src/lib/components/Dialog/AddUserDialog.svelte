<script lang="ts">
	import Dialog from './Dialog.svelte';
	import Login from '../LoginForm.svelte';
	import { navigate } from '../StackRouter/StackRouter.js';
</script>

<Dialog let:close>
	<Login
		on:login={() => {
			close();
			navigate('/', { refresh: true });
		}}
	/>
</Dialog>
