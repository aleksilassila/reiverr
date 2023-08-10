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
	$: buttonStyle = classNames(
		'flex items-center gap-1 rounded-xl font-medium select-none cursor-pointer selectable transition-all flex-shrink-0',
		{
			'bg-white text-zinc-900 font-extrabold backdrop-blur-lg': type === 'primary',
			'hover:bg-amber-400 focus-within:bg-amber-400 hover:border-amber-400 focus-within:border-amber-400':
				type === 'primary' && !disabled,
			'text-zinc-200 bg-zinc-400 bg-opacity-20 backdrop-blur-lg': type === 'secondary',
			'focus-visible:bg-zinc-200 focus-visible:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-800':
				(type === 'secondary' || type === 'tertiary') && !disabled,
			'rounded-full': type === 'tertiary',
			'py-2 px-6 sm:py-3 sm:px-6': size === 'lg',
			'py-2 px-6': size === 'md',
			'py-1 px-3': size === 'sm',
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
