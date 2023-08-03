<script lang="ts">
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';

	export let index = 0;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
</script>

<div
	class={classNames('rounded overflow-hidden shadow-lg placeholder shrink-0 aspect-video', {
		'h-40': size === 'md',
		'h-60': size === 'lg',
		'w-full': size === 'dynamic'
	})}
	style={'animation-delay: ' + ((index * 100) % 2000) + 'ms;'}
	transition:fade|global
/>
