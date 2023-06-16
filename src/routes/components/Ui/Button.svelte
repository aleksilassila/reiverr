<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let size: 'md' | 'sm' | 'lg' = 'md';
	export let type: 'primary' | 'secondary' | 'tertiary' = 'primary';
	export let disabled = false;

	export let href: string | undefined = undefined;
	export let target: string | undefined = undefined;

	const buttonStyle = classNames(
		'border-2 border-white transition-colors uppercase tracking-widest text-xs',
		{
			'bg-white text-zinc-900 font-extrabold': type === 'primary',
			'hover:bg-amber-400 hover:border-amber-400': type === 'primary' && !disabled,
			'font-semibold': type === 'secondary',
			'hover:bg-white hover:text-black': type === 'secondary' && !disabled,
			'px-8 py-3.5': size === 'lg',
			'px-6 py-2.5': size === 'md',
			'px-5 py-2': size === 'sm',
			'opacity-70': disabled,
			'cursor-pointer': !disabled
		}
	);

	const handleClick = (event) => {
		if (href) {
			if (target === '_blank') window.open(href, target).focus();
			else window.open(href, target as string);
		} else {
			dispatch('click', event);
		}
	};
</script>

<button class={buttonStyle} on:click={handleClick} on:mouseover on:mouseleave {disabled}>
	<slot />
</button>
