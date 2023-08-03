<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let size: 'md' | 'sm' | 'lg' = 'md';
	export let type: 'primary' | 'secondary' | 'tertiary' = 'secondary';
	export let disabled = false;

	export let href: string | undefined = undefined;
	export let target: string | undefined = '_self';

	let buttonStyle: string;
	// $: buttonStyle = classNames(
	// 	'border-2 border-white transition-all uppercase tracking-widest text-xs whitespace-nowrap',
	// 	{
	// 		'bg-white text-zinc-900 font-extrabold': type === 'primary',
	// 		'hover:bg-amber-400 hover:border-amber-400': type === 'primary' && !disabled,
	// 		'font-semibold': type === 'secondary',
	// 		'hover:bg-white hover:text-black': type === 'secondary' && !disabled,
	// 		'px-8 py-3.5': size === 'lg',
	// 		'px-6 py-2.5': size === 'md',
	// 		'px-5 py-2': size === 'sm',
	// 		'opacity-70': disabled,
	// 		'cursor-pointer': !disabled
	// 	}
	// );
	$: buttonStyle = classNames(
		'flex items-center gap-1 py-3 px-6 rounded-xl font-medium select-none cursor-pointer selectable transition-all backdrop-blur-lg',
		{
			'bg-white text-zinc-900 font-extrabold': type === 'primary',
			'hover:bg-amber-400 hover:border-amber-400': type === 'primary' && !disabled,
			'text-zinc-200 bg-stone-800 bg-opacity-30': type === 'secondary',
			'focus-visible:bg-zinc-200 focus-visible:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-800':
				type === 'secondary' && !disabled,
			'py-3 px-6': size === 'lg',
			// 'py-3 px-6': size === 'md',
			'px-5 py-2': size === 'sm',
			'opacity-50': disabled,
			'cursor-pointer': !disabled
		}
	);

	const handleClick = (event: MouseEvent) => {
		if (href) {
			window.open(href, target)?.focus();
		} else {
			dispatch('click', event);
		}
	};
</script>

<button
	class={buttonStyle}
	on:click={handleClick}
	on:focus
	on:mouseover
	on:mouseleave
	on:blur
	{disabled}
>
	<slot />
</button>
