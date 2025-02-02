<script lang="ts">
	import classNames from 'classnames';
	import Container from './Container.svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from './AnimateScale.svelte';
	import type { ComponentType } from 'svelte';
	import IconOverlay from './IconOverlay.svelte';

	export let url: string;
	export let icon: ComponentType | undefined = undefined;
	export let focusOnMount = false;
	let hasFocus: Readable<boolean>;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		bind:hasFocus
		class={classNames(
			'w-40 h-40 rounded-xl overflow-hidden cursor-pointer relative',
			{
				selected: $hasFocus,
				unselected: !$hasFocus
			},
			$$restProps.class
		)}
		{focusOnMount}
		on:clickOrSelect
	>
		<div class="bg-center bg-cover w-full h-full" style={`background-image: url('${url}')`} />
		{#if icon}
			<IconOverlay {icon} />
		{/if}
	</Container>
</AnimateScale>
