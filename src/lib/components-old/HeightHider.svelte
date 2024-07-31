<script>
	import classNames from 'classnames';

	export let visible = false;
	export let duration = 300;
</script>

<div
	class={classNames('transition-[max-height] duration-1000 overflow-hidden', {
		'max-h-0': !visible,
		'max-h-max': visible
	})}
	style="transition-duration: {duration}ms;"
>
	<slot />
</div>
