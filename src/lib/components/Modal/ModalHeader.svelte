<script lang="ts">
	import classNames from 'classnames';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, Cross2 } from 'radix-icons-svelte';

	export let close = () => {};
	export let back: (() => void) | undefined = undefined;
	export let text = back ? 'Back' : '';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex text-zinc-200 items-center p-3 px-5 gap-4 border-b border-zinc-700">
	<slot>
		{#if text}
			<button
				class={classNames('flex-1 flex items-center gap-1', {
					'cursor-pointer text-zinc-300 hover:text-zinc-200': !!back,
					'cursor-default': !back
				})}
				on:click={() => back?.()}
				tabindex={back ? 0 : -1}
			>
				{#if !!back}
					<ChevronLeft size={20} />
				{/if}
				<h1 class="font-medium">{text}</h1>
			</button>
		{/if}
	</slot>
	<IconButton on:click={close}>
		<Cross2 size={20} />
	</IconButton>
</div>
