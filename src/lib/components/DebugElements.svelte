<script lang="ts">
	import { Selectable } from '../selectable';
	import classNames from 'classnames';
	import { onMount } from 'svelte';

	let showOverlay = false;
	let x = 0;
	let y = 0;
	let width = 0;
	let height = 0;

	const focusedObject = Selectable.focusedObject;
	let element: HTMLElement | undefined = undefined;

	focusedObject.subscribe((object) => {
		element = object?.getHtmlElement();
		if (element) updateOverlayPosition(element);
	});

	function updateOverlayPosition(htmlElement: HTMLElement) {
		const rect = htmlElement.getBoundingClientRect();
		x = rect.left;
		y = rect.top;
		width = rect.width;
		height = rect.height;
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.repeat) return;
		if (event.key === 'Shift') showOverlay = true;
	};

	const handleKeyup = (event: KeyboardEvent) => {
		if (event.repeat) return;
		if (event.key === 'Shift') showOverlay = false;
	};

	onMount(() => {
		const interval = setInterval(() => {
			if (element && showOverlay) {
				updateOverlayPosition(element);
			}
		}, 100);
		return () => clearInterval(interval);
	});
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

{#if showOverlay}
	<div
		class={classNames('fixed bg-red-500/20 z-50 pointer-events-none')}
		style={`left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`}
	/>

	<div class="fixed inset-0 border-x-[96px] border-y-[48px] border-green-500/10 z-50" />
	<div class="fixed inset-0 px-32 grid grid-cols-12 gap-x-16 *:bg-purple-500/10 items-stretch z-50">
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
		<div />
	</div>

	<!--	<div class="fixed inset-0 border-x-[96px] border-y-[48px] border-green-500/10 z-50" />-->
	<!--	<div class="fixed inset-0 px-28 grid grid-cols-12 gap-x-10 *:bg-purple-500/10 items-stretch z-50">-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--		<div />-->
	<!--	</div>-->
{/if}
