<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import Button from '../components/Button.svelte';
	import { onMount } from 'svelte';
	import { isTizen } from '../utils/browser-detection';
	import Toggle from '../components/Toggle.svelte';
	import { localSettings } from '../stores/localstorage.store';

	let lastKeyCode = 0;
	let lastKey = '';
	let tizenMediaKey = '';

	// onMount(() => {
	// 	if (isTizen()) {
	// 		const myMediaKeyChangeListener = {
	// 			onpressed: function (key: string) {
	// 				console.log('Pressed key: ' + key);
	// 				tizenMediaKey = key;
	// 			}
	// 		};
	//
	// 		// eslint-disable-next-line no-undef
	// 		tizen?.tvinputdevice?.registerKey?.('MediaPlayPause');
	// 		(tizen as any)?.mediakey?.setMediaKeyEventListener?.(myMediaKeyChangeListener);
	// 	}
	// });
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	User agent: {window?.navigator?.userAgent}
	<div>Last key code: {lastKeyCode}</div>
	<div>Last key: {lastKey}</div>
	{#if tizenMediaKey}
		<div>Tizen media key: {tizenMediaKey}</div>
	{/if}
	<div class="flex items-center justify-between">
		<label class="mr-2">Animate scrolling</label>
		<Toggle
			checked={$localSettings.animateScrolling}
			on:change={({ detail }) => localSettings.update((p) => ({ ...p, animateScrolling: detail }))}
		/>
	</div>
	<div class="flex items-center justify-between">
		<label class="mr-2">Use CSS Transitions</label>
		<Toggle
			checked={$localSettings.useCssTransitions}
			on:change={({ detail }) => localSettings.update((p) => ({ ...p, useCssTransitions: detail }))}
		/>
	</div>
	<Button on:clickOrSelect={appState.logOut} class="hover:bg-red-500">Log Out</Button>
</Container>

<svelte:window
	on:keydown={(e) => {
		console.log('keypress', e);
		lastKeyCode = e.keyCode;
		lastKey = e.key;
	}}
/>
