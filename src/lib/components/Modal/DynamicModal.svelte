<script lang="ts">
	import classNames from 'classnames';
	import { modalStack } from '../../stores/modal.store';
	import { fade } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && $modalStack.top) {
			modalStack.close($modalStack.top.id);
		}
	}

	onDestroy(() => {
		modalStack.reset();
	});
</script>

<svelte:window on:keydown={handleShortcuts} />

<svelte:head>
	{#if $modalStack.top}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

{#each $modalStack.stack || [] as modal (modal.id)}
	{@const hidden = $modalStack.top?.group === modal.group && $modalStack.top?.id !== modal.id}

	{#if modal.group === modal.id}
		<div
			class="fixed inset-0 bg-stone-950 bg-opacity-80 z-20"
			transition:fade|global={{ duration: 150 }}
		/>
	{/if}

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class={classNames(
			'fixed inset-0 justify-center items-center z-20 overflow-hidden flex transition-opacity reltaive',
			{
				'opacity-0': hidden
			}
		)}
		on:click|self={() => modalStack.close(modal.id)}
	>
		<svelte:component this={modal.component} {...modal.props} modalId={modal.id} />
	</div>
{/each}
