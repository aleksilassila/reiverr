<script lang="ts">
	import { TMDB_PROFILE_SMALL } from '$lib/constants';
	import classNames from 'classnames';

	export let tmdbId: number;
	export let knownFor: string[] = [];
	export let name: string;
	export let backdropUri: string;
	export let department: string;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
</script>

<a
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
			<!-- <h2 class="text-sm text-zinc-300 tracking-wider font-medium line-clamp-2">
				{knownFor.join(', ')}
			</h2> -->
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
</a>
