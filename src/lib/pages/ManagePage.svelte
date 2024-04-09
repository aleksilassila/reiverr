<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import Button from '../components/Button.svelte';
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	User agent: {window.navigator.userAgent}
	<Button on:clickOrSelect={appState.logOut} class="hover:bg-red-500">Log Out</Button>
</Container>
