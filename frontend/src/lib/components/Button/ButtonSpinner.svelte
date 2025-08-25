<script lang="ts">
	import Spinner from '../Utils/Spinner.svelte';

	export let loading = false;
</script>

<div class={$$restProps.class}>
	{#if loading}
		<Spinner />
	{:else}
		<slot />
	{/if}
</div>
