<script lang="ts">
	import classNames from 'classnames';
	import { onMount } from 'svelte';

	let scrollHeight = 0;
	let clientHeight = 0;
	let scrollY = 0;
	let element: HTMLDivElement;

	onMount(() => {
		scrollHeight = element.scrollHeight;
		clientHeight = element.clientHeight;
	});
</script>

<div
	bind:this={element}
	class={classNames('relative min-h-0 overflow-y-auto scrollbar-hide', $$restProps.class)}
	style={`-webkit-mask-image: linear-gradient(to bottom, transparent, black ${
		scrollY !== 0 ? '3rem' : '0'
	}, black ${scrollY + clientHeight < scrollHeight ? 'calc(100% - 3rem)' : '100%'}, transparent);`}
	on:scroll={(e) => {
		scrollY = e.currentTarget.scrollTop;
		scrollHeight = e.currentTarget.scrollHeight;
		clientHeight = e.currentTarget.clientHeight;
	}}
>
	<slot />
</div>
