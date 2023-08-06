<script lang="ts">
	import { fly } from 'svelte/transition';
	import { contextMenu } from './ContextMenu';

	export let heading = '';
	export let disabled = false;

	const id = Symbol();

	let menu: HTMLDivElement;

	let position = { x: 0, y: 0 };

	function close() {
		contextMenu.hide();
	}

	function handleOpen(event: MouseEvent) {
		if (disabled) return;

		position = { x: event.clientX, y: event.clientY };
		contextMenu.show(id);
	}

	function handleClickOutside(event: MouseEvent) {
		if (!menu?.contains(event.target as Node)) {
			event.preventDefault();
			event.stopPropagation();
			close();
		}
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && $contextMenu === id) {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} on:click={handleClickOutside} />
<svelte:head>
	{#if $contextMenu === id}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>
<!-- <svelte:body bind:this={body} /> -->

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:contextmenu|preventDefault={handleOpen}>
	<slot />
</div>

{#if $contextMenu === id}
	{#key position}
		<div
			class="fixed z-50 px-1 py-1 bg-zinc-800 bg-opacity-50 rounded-lg backdrop-blur-xl flex flex-col"
			style="left: {position.x}px; top: {position.y}px;"
			bind:this={menu}
			in:fly|global={{ y: 5, duration: 100, delay: 100 }}
			out:fly|global={{ y: 5, duration: 100 }}
		>
			<slot name="title">
				{#if heading}
					<h2
						class="text-xs text-zinc-200 opacity-60 tracking-wide font-semibold px-3 py-1 line-clamp-1"
					>
						{heading}
					</h2>
				{/if}
			</slot>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="flex flex-col gap-0.5" on:click={() => close()}>
				<slot name="menu" />
			</div>
		</div>
	{/key}
{/if}
