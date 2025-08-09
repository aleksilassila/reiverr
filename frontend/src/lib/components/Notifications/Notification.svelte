<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';

	export let duration = 5000;
	export let title: string;
	export let body = '';
	export let type: 'info' | 'warning' | 'error' = 'info';
	export let persistent = false;

	let visible = true;
	let timeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		timeout = setTimeout(() => {
			visible = false;
		}, duration);

		return () => clearTimeout(timeout);
	});
</script>

{#if visible && !persistent}
	<div class={classNames('bg-primary-800 rounded-xl px-6 py-4 w-80 shadow-xl', {})}>
		<h1 class="mb-1 h5">{title}</h1>
		{#if body}
			<div class="text-secondary-400">{body}</div>
		{/if}
	</div>
{/if}
