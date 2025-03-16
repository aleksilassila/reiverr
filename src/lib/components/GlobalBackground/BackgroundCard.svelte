<script lang="ts">
	import Card from '$lib/components/Card/Card.svelte';

	export let backdropUrl: string;
	export let videoUrl: string | undefined = undefined;
</script>

<Card {backdropUrl} orientation="landscape" size="sm" on:click on:clickOrSelect on:enter />
