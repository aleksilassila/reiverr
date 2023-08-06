<script lang="ts">
	import { TMDB_PROFILE_SMALL } from '$lib/constants';
	import classNames from 'classnames';

	export let tmdbId: number;
	export let backdropUri: string;
	export let name: string;
	export let subtitle: string;

	export let size: 'dynamic' | 'md' | 'lg' = 'md';
</script>

<a
	class={classNames(
		'flex flex-col justify-start gap-3 p-4 rounded-xl overflow-hidden relative shadow-lg shrink-0 selectable hover:text-inherit bg-stone-900 hover:bg-stone-800 group',
		{
			'w-36 h-56': size === 'md',
			'h-52': size === 'lg',
			'w-full': size === 'dynamic'
		}
	)}
	href={`https://www.themoviedb.org/person/${tmdbId}`}
>
	<div
		class="mx-auto rounded-full overflow-hidden flex-shrink-0 aspect-square w-full bg-zinc-200 bg-opacity-20"
	>
		<div
			style={"background-image: url('" + TMDB_PROFILE_SMALL + backdropUri + "')"}
			class="bg-center bg-cover group-hover:scale-105 transition-transform w-full h-full"
		/>
	</div>
	<div>
		<h2 class="text-sm text-zinc-300 font-medium line-clamp-1">{subtitle}</h2>
		<h1 class="font-semibold line-clamp-2">
			{name}
		</h1>
	</div>
	<!-- <div
		class="h-full w-full transition-opacity flex flex-col justify-between cursor-pointer relative z-[1] peer group"
	>
		<div class="opacity-0 group-hover:opacity-100" />
		<div class="bg-gradient-to-t from-darken from-40% p-2 px-3 pt-8">
			<h2
				class="text-xs text-zinc-300 tracking-wider font-medium opacity-0 group-hover:opacity-100"
			>
				{department}
			</h2>
			<h1
				class={classNames('font-semibold tracking-wider', {
					'text-lg': size === 'lg'
				})}
			>
				{name}
			</h1>
		</div>
	</div> -->
</a>

<!-- <a
	class={classNames(
		'rounded-xl overflow-hidden relative shadow-lg shrink-0 aspect-[4/5] selectable block hover:text-inherit',
		{
			'h-40': size === 'md',
			'h-52': size === 'lg',
			'w-full': size === 'dynamic'
		}
	)}
	href={`/person/${tmdbId}`}
>
	<div
		class="h-full w-full transition-opacity flex flex-col justify-between cursor-pointer relative z-[1] peer group"
	>
		<div class="opacity-0 group-hover:opacity-100">
		</div>
		<div class="bg-gradient-to-t from-darken from-40% p-2 px-3 pt-8">
			<h2
				class="text-xs text-zinc-300 tracking-wider font-medium opacity-0 group-hover:opacity-100"
			>
				{department}
			</h2>
			<h1
				class={classNames('font-semibold tracking-wider', {
					'text-lg': size === 'lg'
				})}
			>
				{name}
			</h1>
		</div>
	</div>
	<div
		style={"background-image: url('" + TMDB_PROFILE_SMALL + backdropUri + "')"}
		class="absolute inset-0 bg-center bg-cover peer-hover:scale-105 transition-transform"
	/>
</a> -->
