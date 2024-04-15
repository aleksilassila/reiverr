<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import Button from '../components/Button.svelte';
	import { onMount } from 'svelte';
	import { isTizen } from '../utils/browser-detection';

	let lastKeyCode = 0;
	let lastKey = '';
	let tizenMediaKey = '';

	onMount(() => {
		if (isTizen()) {
			var myMediaKeyChangeListener = {
				onpressed: function (key: string) {
					console.log('Pressed key: ' + key);
					tizenMediaKey = key;
				}
			};

			// eslint-disable-next-line no-undef
			tizen.tvinputdevice.registerKey('MediaPlayPause');
			(tizen as any).mediakey.setMediaKeyEventListener(myMediaKeyChangeListener);
		}
	});
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	User agent: {window.navigator.userAgent}
	<div>Last key code: {lastKeyCode}</div>
	<div>Last key: {lastKey}</div>
	{#if tizenMediaKey}
		<div>Tizen media key: {tizenMediaKey}</div>
	{/if}
	<Button on:clickOrSelect={appState.logOut} class="hover:bg-red-500">Log Out</Button>
</Container>

<svelte:window
	on:keydown={(e) => {
		console.log('keypress', e);
		lastKeyCode = e.keyCode;
		lastKey = e.key;
	}}
/>
