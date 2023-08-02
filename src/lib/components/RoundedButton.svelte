<script lang="ts">
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';

	export let disableIcon = false;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
	class={classNames(
		'text-sm py-1 px-3 rounded-full flex items-center select-none cursor-pointer transition-colors selectable border',
		'border-zinc-600 text-zinc-300 hover:bg-zinc-100 hover:border-zinc-100 hover:text-zinc-800 focus-visible:bg-zinc-100 focus-visible:border-zinc-100 focus-visible:text-zinc-800'
	)}
	on:click
>
	<span><slot /></span>
	{#if !disableIcon}
		<slot name="icon">
			<ChevronRight size={20} />
		</slot>
	{/if}
</button>
