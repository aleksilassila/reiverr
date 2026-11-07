<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';

	interface Props {
		src: string;
		alt?: string;
		width?: number | undefined;
		height?: number | undefined;
		children?: Snippet;
		class?: string;
	}

	let {
		src,
		alt = '',
		width = undefined,
		height = undefined,
		children,
		class: className
	}: Props = $props();

	let loaded = $state(false);

	function handleLoad() {
		loaded = true;
	}
</script>

<div
	class={classNames(
		'transition-opacity duration-300 overflow-hidden',
		{
			'opacity-0': !loaded,
			'opacity-100': loaded
		},
		className
	)}
>
	<img
		{src}
		{alt}
		style="object-fit: cover; width: 100%; height: 100%;"
		loading="lazy"
		onload={handleLoad}
		{width}
		{height}
		draggable="false"
	/>
	{@render children?.()}
</div>
