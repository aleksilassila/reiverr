<script>
	import { TriangleRight } from 'radix-icons-svelte';
	import IconButton from './IconButton.svelte';
	import classNames from 'classnames';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class={classNames(
		$$restProps.class,
		'backdrop-blur-lg rounded-full bg-[#00000044] text-zinc-300 hover:text-zinc-200 p-2'
	)}
	on:click
>
	<TriangleRight size={30} />
</div>
