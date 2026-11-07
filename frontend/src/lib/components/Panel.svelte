<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';
	import IconButton from './FloatingIconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';

	interface Props {
		size?: 'sm' | 'full' | 'lg' | 'dynamic';
		onClose?: (() => void) | undefined;
		children?: Snippet;
		class?: string;
	}

	let { size = 'sm', onClose = undefined, children, class: className }: Props = $props();
</script>

<div
	class={classNames(
		'bg-primary-800 rounded-2xl px-8 py-8 relative shadow-xl flex flex-col transition-[max-width]',
		{
			'flex-1 max-h-full max-w-lg min-h-0 overflow-y-auto scrollbar-hide': size === 'sm',
			'flex-1 h-full overflow-hidden': size === 'full',
			'flex-1 max-h-full max-w-[56rem] min-h-0 overflow-y-auto scrollbar-hide': size === 'lg',
			'max-w-max overflow-hidden': size === 'dynamic'
		},
		className
	)}
>
	{#if onClose}
		<div class="absolute top-4 right-4">
			<IconButton onclick={onClose}>
				<Cross1 size={20} />
			</IconButton>
		</div>
	{/if}
	{@render children?.()}
</div>
