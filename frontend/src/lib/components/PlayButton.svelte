<script lang="ts">
	import { TriangleRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import type { SvelteHTMLElements } from 'svelte/elements';

	let { ...rest }: SvelteHTMLElements['div'] = $props();
</script>

<div
	{...rest}
	class={classNames(
		rest.class,
		'backdrop-blur-lg rounded-full bg-[#00000044] text-zinc-300 hover:text-zinc-200 p-2'
	)}
>
	<TriangleRight size={30} />
</div>
