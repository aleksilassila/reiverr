<script lang="ts">
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';

	export let season: string;
	export let episode: string;
</script>

<DetachedPage>
	Episode Page for {season}x{episode}
</DetachedPage>
