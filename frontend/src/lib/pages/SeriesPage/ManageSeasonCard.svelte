<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import Container from '$components/Container.svelte';
	import AnimateScale from '../../components/AnimateScale.svelte';
	import classNames from 'classnames';
	import { Plus } from 'radix-icons-svelte';
	import { getCardDimensions } from '../../utils';
	import IconOverlay from '../../components/IconOverlay.svelte';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onEnter?: ContainerProps['onEnter'];
		backdropUrl: string;
	}

	let { backdropUrl, onClickOrSelect, onEnter }: Props = $props();

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;

	let dimensions = $state(
		getCardDimensions({
			viewportWidth: window.innerWidth,
			orientation: 'landscape'
		})
	);
</script>

<svelte:window
	onresize={(e) =>
		(dimensions = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation: 'landscape'
		}))}
/>
<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'flex flex-col shrink-0',
			'overflow-hidden rounded-2xl cursor-pointer group relative selectable transition-opacity'
		)}
		style={`width: ${dimensions.width}px; height: ${dimensions.height}px`}
		{onClickOrSelect}
		{onEnter}
		{selectable}
	>
		<div
			class="bg-cover bg-center absolute inset-0"
			style={`background-image: url('${backdropUrl}')`}
		></div>
		<IconOverlay icon={Plus} />
	</Container>
</AnimateScale>
