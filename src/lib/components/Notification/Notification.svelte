<script lang="ts">
	import { notificationStack } from '$lib/stores/notification.store';
	import classNames from 'classnames';
	import { Cross2 } from 'radix-icons-svelte';
	import { fade, fly } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';

	export let id: symbol;

	export let title: string;
	export let description: string;
	export let duration = 0;

	function handleClose() {
		console.log('close');
		notificationStack.close(id);
	}
</script>

<div
	class="bg-zinc-900 bg-opacity-60 rounded-lg backdrop-blur-xl overflow-hidden
flex flex-col w-72"
	in:fly|global={{ duration: 150, x: 50 }}
	out:fade|global={{ duration: 150 }}
>
	<div class="relative">
		<div
			class={classNames('left-0 absolute bg-zinc-200 bg-opacity-10 h-full w-full', {
				'animate-timer': duration
			})}
			style="animation-duration: {duration - 1000}ms;"
			hidden={!duration}
		/>
		<div
			class="relative z-[1] flex items-center justify-between bg-zinc-200 bg-opacity-10 p-1 px-3"
		>
			<div>
				<h1 class="text-zinc-200 font-medium text-sm">{title}</h1>
			</div>
			<IconButton on:click={handleClose}>
				<Cross2 size={15} />
			</IconButton>
		</div>
	</div>

	<div class="flex-1 flex flex-col p-2 px-3">
		<p class="text-sm text-zinc-400">{description}</p>
	</div>
</div>
