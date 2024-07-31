<script lang="ts">
	import classNames from 'classnames';
	import { Update } from 'radix-icons-svelte';
	export let type: 'base' | 'success' | 'error' = 'base';
	export let loading = false;
	export let disabled = false;
</script>

<button
	on:click
	class={classNames(
		'p-1.5 px-4 text-sm text-zinc-200 rounded-lg border',
		'hover:bg-opacity-30 transition-colors',
		'flex items-center gap-2',
		{
			'bg-green-500 bg-opacity-20 text-green-200 border-green-900': type === 'success',
			'bg-red-500 bg-opacity-20 text-red-200 border-red-900': type === 'error',
			'bg-zinc-600 border-zinc-800 bg-opacity-20': type === 'base',
			'cursor-not-allowed opacity-75 pointer-events-none': disabled || loading
		},
		$$restProps.class
	)}
>
	{#if loading}
		<Update class="animate-spin" size={14} />
	{/if}
	<slot />
</button>
