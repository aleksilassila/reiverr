<script lang="ts">
	import classNames from 'classnames';

	export let title: string;
	export let size: 'md' | 'sm' = 'md';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<h1
	on:click
	class={classNames(
		'text-left font-semibold tracking-wider text-stone-200 mt-1',
		title.length || 0 < 15
			? {
					'text-4xl sm:text-5xl 2xl:text-6xl': size === 'md',
					'text-2xl sm:text-3xl 2xl:text-4xl': size === 'sm'
			  }
			: {
					'text-3xl sm:text-4xl 2xl:text-5xl': size === 'md',
					'text-xl sm:text-2xl 2xl:text-3xl': size === 'sm'
			  },
		$$restProps.class
	)}
>
	{title}
</h1>
