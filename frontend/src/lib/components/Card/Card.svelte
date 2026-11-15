<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import classNames from 'classnames';
	import { DotsVertical } from 'radix-icons-svelte';
	import { getCardDimensions } from '../../utils';
	import AnimatedSelection from '../AnimateScale.svelte';
	import Container from '../Container.svelte';
	import LazyImg from '../LazyImg.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import type { CardBadge } from './Card';

	type Props = Omit<ContainerProps, 'children'> & {
		backdropUrl?: string;
		// export let group = false;
		title?: string;
		progress?: number; // keep
		runtime?: number;
		disabled?: boolean;
		size?: 'md' | 'lg' | 'sm';
		orientation?: 'portrait' | 'landscape';
		/** Short marks in the top right corner, such as a count or a warning */
		badges?: CardBadge[];
		/** Opens the actions of the card: a long press on the remote, or the dots that show on hover */
		onLongPress?: ContainerProps['onLongPress'];
		children?: Snippet<[{ hasFocus: boolean; width: number; height: number }]>;
	};

	let {
		backdropUrl = '',
		title = '',
		progress = 0,
		runtime = 0,
		disabled = false,
		size = 'md',
		orientation = 'landscape',
		badges = [],
		children,
		onLongPress,
		...rest
	}: Props = $props();

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
	let dimensions = $state(
		getCardDimensions({ viewportWidth: window.innerWidth, orientation, size })
	);

	let lowerLimit = $derived(Math.min(runtime ? 15 / runtime : 0.1, 0.1));
	let upperLimit = $derived(1 - Math.max(runtime ? 10 / runtime : 0.1, 0.1));
</script>

<svelte:window
	onresize={(e) =>
		(dimensions = getCardDimensions({
			viewportWidth: e.currentTarget.innerWidth,
			orientation,
			size
		}))}
/>

<!-- {#if group}
		<div class="absolute inset-0 scale-95 translate-y-3.5 opacity-50">
			<LazyImg src={backdropUrl} class="absolute inset-0 rounded-xl" />
			<div class="absolute inset-0 bg-white/10 rounded-xl" />

			<LazyImg
				src={backdropUrl}
				class="absolute inset-0 scale-95 translate-y-4 rounded-xl opacity-25"
			/>
			<div class="absolute inset-0 scale-95 translate-y-4 rounded-xl bg-white/10 opacity-25" />
		</div>
	{/if} -->
<AnimatedSelection hasFocus={$hasFocus} class="relative">
	<Container
		{...rest}
		{disabled}
		class={classNames(
			'relative flex flex-shrink-0 rounded-xl group hover:text-inherit overflow-hidden text-left cursor-pointer',
			'selectable',
			rest.class
		)}
		style={`width: ${dimensions.width}px; height: ${dimensions.height}px;`}
		focusOnClick
		{selectable}
		{onLongPress}
	>
		{#if children}{@render children({
				hasFocus: $hasFocus,
				width: dimensions.width,
				height: dimensions.height
			})}{:else}
			{#if backdropUrl}
				<LazyImg
					src={backdropUrl}
					class="absolute inset-0"
					width={dimensions.width}
					height={dimensions.height}
				/>
			{:else}
				<h1 class="text-center flex-1 h2 bg-primary-800 flex items-center justify-center p-4">
					{title}
				</h1>
			{/if}
		{/if}

		{#if badges.length}
			<div
				class={classNames('absolute top-2 right-2 flex space-x-1 transition-opacity', {
					'group-hover:opacity-0': onLongPress
				})}
			>
				{#each badges as badge}
					<div
						class={classNames(
							'flex items-center rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums',
							{
								'bg-secondary-900/80 text-secondary-100': badge.type !== 'error',
								'bg-red-500/90 text-white': badge.type === 'error'
							}
						)}
					>
						{#if badge.icon}
							<badge.icon size={14} class={badge.label ? 'mr-1' : ''} />
						{/if}
						{#if badge.label}
							{badge.label}
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if onLongPress}
			<button
				class="absolute top-2 right-2 z-20 rounded-full p-1.5 bg-secondary-950/75 text-secondary-200 opacity-0 group-hover:opacity-100 hover:bg-primary-500 hover:text-secondary-950 transition-opacity"
				onclick={(e) => {
					e.stopPropagation();
					onLongPress?.(selectable);
				}}
			>
				<DotsVertical size={20} />
			</button>
		{/if}

		{#if progress && progress > lowerLimit && progress < upperLimit}
			<div
				class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 bg-gradient-to-t ease-in-out"
			>
				<ProgressBar {progress} />
			</div>
		{/if}
	</Container>
</AnimatedSelection>
