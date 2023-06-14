<script lang="ts">
	import SmallPoster from './components/SmallPoster/SmallPoster.svelte';
	import type { PageData } from './$types';
	import ResourceDetails from './components/ResourceDetails/ResourceDetails.svelte';
	import ResourceDetailsControls from './ResourceDetailsControls.svelte';

	export let data: PageData;
	let movies = data.showcases;
	let movie = movies[0];
</script>

<ResourceDetails remoteResource={movie}>
	<ResourceDetailsControls slot="page-controls" />
</ResourceDetails>

{#if !data?.showcases?.length}
	<div>Loading</div>
{:else}
	<div
		class="bg-cover bg-center"
		style={"background-image: url('https://www.themoviedb.org/t/p/original/" +
			movie.backdrop_path +
			"')"}
	>
		<div class="p-8 flex flex-col gap-6 backdrop-blur-xl bg-[#000000dd]">
			<h1 class="uppercase tracking-widest font-bold">Continue Watching</h1>
			<div class="flex gap-4 overflow-x-scroll">
				{#each data.showcases.splice(0, 5) as item (item.id)}
					<SmallPoster tmdbId={item.id} />
				{/each}
			</div>
		</div>
	</div>
{/if}
