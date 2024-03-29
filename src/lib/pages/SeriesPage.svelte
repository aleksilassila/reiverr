<script lang="ts">
	import Container from '../../Container.svelte';
	import SidebarMargin from '../components/SidebarMargin.svelte';
	import HeroCarousel from '../components/HeroCarousel/HeroCarousel.svelte';

	export let id: string;

	let heroIndex: number;
</script>

<SidebarMargin>
	<Container focusOnMount>
		<HeroCarousel bind:index={heroIndex} urls={Promise.resolve([])}>
			{id}
		</HeroCarousel>
		<Container on:click={() => history.back()}>Go back</Container>
	</Container>
</SidebarMargin>
