<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import Button from '../components/Button.svelte';

	let lastKeyCode = 0;
	let lastKey = '';
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	User agent: {window.navigator.userAgent}
	<div>Last key code: {lastKeyCode}</div>
	<div>Last key: {lastKey}</div>
	<Button on:clickOrSelect={appState.logOut} class="hover:bg-red-500">Log Out</Button>
</Container>

<svelte:window
	on:keydown={(e) => {
		console.log('keypress', e);
		lastKeyCode = e.keyCode;
		lastKey = e.key;
	}}
/>
