<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
	import AnimateScale from '../AnimateScale.svelte';
	import type { Readable } from 'svelte/store';
	import { navigate } from '../StackRouter/StackRouter';

	export let tmdbId: number;
	// export let type: TitleType = 'person';
	export let backdropUrl: string;
	export let name: string;
	export let subtitle: string;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';

	let hasFocus: Readable<boolean>;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'flex flex-col justify-start rounded-xl overflow-hidden relative shrink-0 selectable hover:text-inherit hover:bg-stone-800 focus-visible:bg-stone-800 bg-secondary-800 group text-left cursor-pointer',
			{
				'w-56 h-80': size === 'md',
				'h-52': size === 'lg',
				'w-full': size === 'dynamic'
			}
		)}
		on:clickOrSelect={() => {
			if (tmdbId) navigate(`/person/${tmdbId}`);
		}}
		on:enter
		bind:hasFocus
		focusOnClick
	>
		<!--		<div-->
		<!--			class="mx-auto rounded-full overflow-hidden flex-shrink-0 aspect-square w-full bg-zinc-200 bg-opacity-20"-->
		<!--		>-->
		<!--			<div-->
		<!--				style={"background-image: url('" + backdropUrl + "')"}-->
		<!--				class="bg-center bg-cover group-hover:scale-105 group-focus-visible:scale-105 transition-transform w-full h-full"-->
		<!--			/>-->
		<!--		</div>-->

		<div
			style={"background-image: url('" + backdropUrl + "')"}
			class="bg-center bg-cover w-full h-full"
		/>
		<div class="p-4">
			<h2 class="text-sm text-zinc-300 font-medium line-clamp-1">{subtitle}</h2>
			<h1 class="font-semibold line-clamp-2">
				{name}
			</h1>
		</div>
	</Container>
</AnimateScale>
