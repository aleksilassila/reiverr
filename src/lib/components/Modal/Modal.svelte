<script lang="ts">
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	import { modalStack } from './Modal';

	export let visible = false;
	export let close: () => void;

	const modalId = Symbol();

	$: {
		if (visible) {
			modalStack.push(modalId);
		} else {
			modalStack.remove(modalId);
		}
	}
	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && visible && $modalStack.top === modalId) {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} />

{#if visible && $modalStack.top === modalId}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class={classNames('fixed inset-0 bg-stone-900 bg-opacity-50 justify-center items-center z-20', {
			hidden: !visible,
			'flex overflow-hidden': visible
		})}
		on:click|self={close}
		transition:fade={{ duration: 100 }}
	>
		<slot />
	</div>
{/if}
