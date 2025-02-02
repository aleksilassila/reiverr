<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from '../../../components/AnimateScale.svelte';
	import classNames from 'classnames';
	import { Plus } from 'radix-icons-svelte';
	import { getCardDimensions } from '../../../utils';
	import IconOverlay from '../../../components/IconOverlay.svelte';

	export let backdropUrl: string;

	let hasFocus: Readable<boolean>;

	let dimensions = getCardDimensions(window.innerWidth, 'landscape');
</script>

<svelte:window
	on:resize={(e) => (dimensions = getCardDimensions(e.currentTarget.innerWidth, 'landscape'))}
/>
<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'flex flex-col shrink-0',
			'overflow-hidden rounded-2xl cursor-pointer group relative selectable transition-opacity'
		)}
		style={`width: ${dimensions.width}px; height: ${dimensions.height}px`}
		on:clickOrSelect
		on:enter
		bind:hasFocus
	>
		<div
			class="bg-cover bg-center absolute inset-0"
			style={`background-image: url('${backdropUrl}')`}
		/>
		<IconOverlay icon={Plus} />
	</Container>
</AnimateScale>
