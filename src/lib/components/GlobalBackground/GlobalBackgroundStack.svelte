<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackgroundRegistrar,
		globalBackgroundStack,
		unfocusGlobalBackground
	} from '$lib/components/GlobalBackground/background-stack.store';
	import { type Readable } from 'svelte/store';
	import BackgroundPage from './BackgroundPage.svelte';

	let hasFocus: Readable<boolean>;
</script>

<Container
	bind:hasFocus
	on:back={() => unfocusGlobalBackground()}
	on:mount={globalBackgroundRegistrar.registrar}
/>

<div>
	<div class="absolute inset-0 bg-secondary-900" />

	{#each $globalBackgroundStack as page, i (page.id)}
		{@const next = $globalBackgroundStack[i + 1]}
		<BackgroundPage {page} hasFocus={$hasFocus} nextPage={next} />
		<!-- {#each page.backgrounds as background}
			<div
				class="fixed inset-0 bg-center bg-cover"
				style={`background-image: url("https://www.themoviedb.org/t/p/w342/cIfGAkpvWD2zxHrXzhv3uptYbyV.jpg")`}
			/>
		{/each} -->
	{/each}

	<div class="transition-opacity" class:opacity-0={$hasFocus}>
		<slot />
	</div>
</div>
