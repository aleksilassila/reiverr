<script lang="ts">
	import classNames from 'classnames';

	export let index = 0;
	export let large = false;
</script>

<div
	class={classNames('rounded overflow-hidden shadow-2xl bg-[#ffffff11] animate-pulse shrink-0', {
		'h-40 w-72': !large,
		'h-60 w-96': large
	})}
	style={'animation-delay: ' + ((index * 100) % 2000) + 'ms;'}
/>
