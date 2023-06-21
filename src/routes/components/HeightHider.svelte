<script>
	import classNames from 'classnames';

	export let visible = false;
</script>

<div
	class={classNames('transition-[max-height] duration-1000', {
		'max-h-0': !visible,
		'max-h-screen': visible
	})}
>
	<slot />
</div>
