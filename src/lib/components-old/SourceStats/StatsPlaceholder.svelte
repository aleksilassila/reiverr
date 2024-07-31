<script lang="ts">
	import classNames from 'classnames';

	export let large = false;
</script>

<div
	class={classNames('placeholder w-full rounded-xl', {
		'h-16': !large,
		'h-28': large
	})}
/>
