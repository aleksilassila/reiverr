<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import { useNavigate } from 'svelte-navigator';

	const navigate = useNavigate();
	function handleLogout() {
		console.log('Hello world');
		appState.setToken(undefined);
		// window.location.replace('/');
		window.location.reload();
	}
</script>

<Container class="pl-24">
	<Container on:click={handleLogout} class="hover:bg-red-500">Log Out</Container>
</Container>
