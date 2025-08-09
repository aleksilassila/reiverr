<script lang="ts">
	import { modalStack, modalStackTop } from './modal.store';
	import { onDestroy } from 'svelte';
	import classNames from 'classnames';

	// function handleShortcuts(event: KeyboardEvent) {
	// 	const top = $modalStackTop;
	// 	if ((event.key === 'Escape' || event.key === 'Back' || event.key === 'XF86Back') && top) {
	// 		modalStack.close(top.id);
	// 	}
	// }

	onDestroy(() => {
		modalStack.reset();
	});
</script>

<!--<svelte:window on:keydown={handleShortcuts} />-->

<svelte:head>
	{#if $modalStackTop}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

{#each $modalStack as modal (modal.id)}
	{@const hidden = $modalStackTop?.group === modal.group && $modalStackTop?.id !== modal.id}

	<div class="fixed inset-0 z-30">
		<svelte:component
			this={modal.component}
			{...modal.props}
			modalId={modal.id}
			{hidden}
			groupId={modal.group}
			{modal}
		/>
	</div>
{/each}
