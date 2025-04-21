<script lang="ts">
	import { ChevronRight } from 'radix-icons-svelte';
	import { breadcrumbsContext, playableDataContext } from './actions-page';

	const { tmdbMovie, tmdbSeries, season, episode } = playableDataContext.getContext();
	const { breadcrumbs } = breadcrumbsContext.getContext();
</script>

<div class="mb-8">
	<!-- {#if tmdbMovie}
		{#await $tmdbMovie then tmdbMovie}
			<h2 class="h4">{tmdbMovie.title}</h2>
		{/await}
	{:else if tmdbSeries}
		{#await $tmdbSeries then tmdbSeries}
			<h2 class="h4">{tmdbSeries.name}</h2>
		{/await}
	{/if} -->
	<!-- <h1 class="h1">
		{#if breadcrumbs}
			{breadcrumbs[breadcrumbs.length - 1]}
		{/if}
	</h1> -->

	<div class="flex items-center space-x-2 h3">
		{#if breadcrumbs}
			{#each breadcrumbs as bc, i}
				{@const last = i === breadcrumbs.length - 1}
				<h2>{bc}</h2>
				{#if !last}
					<ChevronRight size={24} />
				{/if}
			{/each}
		{/if}
	</div>
</div>
