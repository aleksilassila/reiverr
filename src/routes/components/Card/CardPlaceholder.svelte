<script lang="ts">
	import classNames from 'classnames';

	export let index = 0;
	export let type: 'dynamic' | 'normal' | 'large' = 'normal';
</script>

<div
	class={classNames(
		'rounded overflow-hidden shadow-2xl bg-[#ffffff11] animate-pulse shrink-0 aspect-video',
		{
			'h-40': type === 'normal',
			'h-60': type === 'large',
			'w-full': type === 'dynamic'
		}
	)}
	style={'animation-delay: ' + ((index * 100) % 2000) + 'ms;'}
/>
