<script lang="ts">
	import classNames from 'classnames';

	export let hasFocus: boolean;
</script>

<div
	class={classNames(
		'relative transition-all',
		{
			'scale-105': hasFocus
		},
		$$restProps.class
	)}
	style="transition: transform 200ms;"
	{...$$restProps}
>
	<slot />
</div>
