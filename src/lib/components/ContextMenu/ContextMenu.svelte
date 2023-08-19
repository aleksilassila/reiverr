<script lang="ts">
	import { fly } from 'svelte/transition';
	import { contextMenu } from './ContextMenu';

	export let heading = '';
	export let disabled = false;
	export let position: 'absolute' | 'fixed' = 'fixed';
	let anchored = position === 'absolute';
	export let bottom = false;

	export let id = Symbol();

	let menu: HTMLDivElement;
	let windowWidth: number;
	let windowHeight: number;

	let fixedPosition = { x: 0, y: 0 };

	function close() {
		contextMenu.hide();
	}

	export function handleOpen(event: MouseEvent) {
		if (disabled || (anchored && $contextMenu === id)) return; // Clicking button will close menu

		fixedPosition = { x: event.clientX, y: event.clientY };
		contextMenu.show(id);
		event.preventDefault();
		event.stopPropagation();
	}

	function handleClickOutside(event: MouseEvent) {
		if (!menu?.contains(event.target as Node) && $contextMenu === id) {
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

<svelte:window
	on:keydown={handleShortcuts}
	on:click={handleClickOutside}
	bind:innerWidth={windowWidth}
	bind:innerHeight={windowHeight}
/>
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:contextmenu|preventDefault={handleOpen} on:click={(e) => anchored && e.stopPropagation()}>
	<slot />
</div>

{#if $contextMenu === id}
	{#key fixedPosition}
		<div
			class={`${position} z-50 my-2 px-1 py-1 bg-zinc-800 bg-opacity-50 rounded-lg backdrop-blur-xl flex flex-col w-max`}
			style={position === 'fixed'
				? `left: ${
						fixedPosition.x - (fixedPosition.x > windowWidth / 2 ? menu?.clientWidth : 0)
				  }px; top: ${
						fixedPosition.y -
						(bottom ? (fixedPosition.y > windowHeight / 2 ? menu?.clientHeight : 0) : 0)
				  }px;`
				: menu?.getBoundingClientRect()?.left > windowWidth / 2
				? `right: 0;${bottom ? 'bottom: 40px;' : ''}`
				: `left: 0;${bottom ? 'bottom: 40px;' : ''}`}
			bind:this={menu}
			in:fly|global={{ y: 5, duration: 100, delay: anchored ? 0 : 100 }}
			out:fly|global={{ y: 5, duration: 100 }}
		>
			<slot name="title">
				{#if heading}
					<h2
						class="text-xs text-zinc-200 opacity-60 tracking-wide font-semibold px-3 py-1 line-clamp-1 text-left"
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
