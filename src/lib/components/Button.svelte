<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let size: 'md' | 'sm' | 'lg' | 'xs' = 'md';
	export let type: 'primary' | 'secondary' | 'tertiary' = 'secondary';
	export let slim = false;
	export let disabled = false;

	export let href: string | undefined = undefined;
	export let target: string | undefined = '_self';

	let buttonStyle: string;
	$: buttonStyle = classNames(
		'flex items-center gap-1 font-medium select-none cursor-pointer selectable transition-all flex-shrink-0',
		{
			'bg-white text-zinc-900 font-extrabold backdrop-blur-lg rounded-xl': type === 'primary',
			'hover:bg-amber-400 focus-within:bg-amber-400 hover:border-amber-400 focus-within:border-amber-400':
				type === 'primary' && !disabled,
			'text-zinc-200 bg-zinc-600 bg-opacity-20 backdrop-blur-lg rounded-xl': type === 'secondary',
			'focus-visible:bg-zinc-200 focus-visible:text-zinc-800 hover:bg-zinc-200 hover:text-zinc-800':
				(type === 'secondary' || type === 'tertiary') && !disabled,
			'rounded-full': type === 'tertiary',

			'py-2 px-6 sm:py-3 sm:px-6': size === 'lg' && !slim,
			'py-2 px-6': size === 'md' && !slim,
			'py-1 px-4': size === 'sm' && !slim,
			'py-1 px-4 text-sm': size === 'xs' && !slim,

			'p-2 sm:p-3': size === 'lg' && slim,
			'p-2': size === 'md' && slim,
			'p-1': size === 'sm' && slim,
			'p-1 text-sm': size === 'xs' && slim,

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
