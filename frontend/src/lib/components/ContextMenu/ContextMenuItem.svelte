<script lang="ts">
	import classNames from 'classnames';
	import type { SvelteHTMLElements } from 'svelte/elements';

	let { disabled = false, children, ...rest }: SvelteHTMLElements['button'] = $props();
</script>

<button
	{...rest}
	class={classNames(
		'text-sm font-medium tracking-wide px-3 py-1 hover:bg-zinc-200 hover:bg-opacity-10 rounded-md text-left cursor-default',
		{
			'opacity-75 pointer-events-none': disabled
		}
	)}
>
	{@render children?.()}
</button>
