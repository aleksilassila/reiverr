<script lang="ts">
	import classNames from 'classnames';

	export let src: string;
	export let alt: string = '';

	let loaded = false;

	function handleLoad() {
		loaded = true;
	}
</script>

<div
	class={classNames(
		'transition-opacity duration-300',
		{
			'opacity-0': !loaded,
			'opacity-100': loaded
		},
		$$restProps.class
	)}
>
	<img
		{src}
		{alt}
		style="object-fit: cover; width: 100%; height: 100%;"
		loading="lazy"
		on:load={handleLoad}
	/>
	<slot />
</div>
