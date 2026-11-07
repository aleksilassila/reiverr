<script lang="ts">
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';

	interface Props {
		index?: number;
		size?: 'dynamic' | 'md' | 'lg';
		orientation?: 'portrait' | 'landscape';
	}

	let { index = 0, size = 'md', orientation = 'landscape' }: Props = $props();
</script>

<div
	class={classNames('rounded-xl overflow-hidden shadow-lg placeholder shrink-0', {
		'aspect-video': orientation === 'landscape',
		'aspect-[2/3]': orientation === 'portrait',
		'w-44': size === 'md' && orientation === 'portrait',
		'h-44': size === 'md' && orientation === 'landscape',
		'w-60': size === 'lg' && orientation === 'portrait',
		'h-60': size === 'lg' && orientation === 'landscape',
		'w-full': size === 'dynamic'
	})}
	style={'animation-delay: ' + ((index * 100) % 2000) + 'ms;'}
	transition:fade|global
	tabindex="0"
></div>
