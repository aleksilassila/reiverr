<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import IconButton from '../VideoPlayer/IconButton.svelte';
	import { Cross1 } from 'radix-icons-svelte';

	export let duration = 5000;
	export let title: string;
	export let body = '';
	export let type: 'info' | 'warning' | 'error' = 'info';
	export let position: 'top' | 'center' = 'top';
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
	<div
		class={classNames('bg-primary-800 rounded-xl px-8 py-4', {
			'w-80': position !== 'center',
			'max-w-xl': position === 'center'
		})}
		transition:fade={{ duration: 150 }}
	>
		<div class="flex space-x-2">
			<div class="flex-1 space-y-1">
				<h1 class="header1">{title}</h1>
				{#if body}
					<div class="body">{body}</div>
				{/if}
			</div>
			<div class="cursor-pointer p-1">
				<Cross1 size={19} />
			</div>
		</div>
	</div>
{/if}
