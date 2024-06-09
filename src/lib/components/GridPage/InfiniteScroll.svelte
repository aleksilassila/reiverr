<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ loadMore: null }>();

	export let hasMore: boolean | undefined = true;

	let observer: IntersectionObserver;
	let loadMoreElement: HTMLElement;

	const loadMore = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting && hasMore) {
				dispatch('loadMore');
			}
		});
	};

	onMount(() => {
		observer = new IntersectionObserver(loadMore, { threshold: 1.0 });
		observer.observe(loadMoreElement);
	});

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});
</script>

<div bind:this={loadMoreElement} id="svelte-infinite-scroll" style="width: 0;" />
