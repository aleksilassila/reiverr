<script lang="ts">
	import classNames from 'classnames';
	import IconButton from './FloatingIconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';

	export let size: 'sm' | 'full' | 'lg' | 'dynamic' = 'sm';
	export let onClose: (() => void) | undefined = undefined;
</script>

<div
	class={classNames(
		'bg-primary-800 rounded-2xl px-8 py-8 relative shadow-xl flex flex-col transition-[max-width]',
		{
			'flex-1 max-h-full max-w-lg min-h-0 overflow-y-auto scrollbar-hide': size === 'sm',
			'flex-1 h-full overflow-hidden': size === 'full',
			'flex-1 max-w-[56rem] min-h-0 overflow-y-auto scrollbar-hide': size === 'lg',
			'max-w-max overflow-hidden': size === 'dynamic'
		},
		$$restProps.class
	)}
>
	{#if onClose}
		<div class="absolute top-4 right-4">
			<IconButton on:click={onClose}>
				<Cross1 size={20} />
			</IconButton>
		</div>
	{/if}
	<slot />
</div>
