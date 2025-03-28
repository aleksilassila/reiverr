<script lang="ts">
	import classNames from 'classnames';

	export let visible = false;
</script>

<div
	class={classNames(
		'py-6 fixed top-0 inset-x-0 z-10 bg-gradient-to-b from-100% from-secondary-900 to-transparent transition-all',
		{
			'opacity-0 pointer-events-none -translate-y-4': visible
		},
		$$restProps.class
	)}
>
	<slot {visible} />
</div>
