<script lang="ts">
	import classNames from 'classnames';

	export let size: 'sm' | 'full' | 'lg' | 'dynamic' = 'sm';
</script>

<div
	class={classNames(
		'bg-primary-800 rounded-2xl p-12 relative shadow-xl flex flex-col transition-[max-width]',
		{
			'flex-1 max-h-full max-w-lg min-h-0 overflow-y-auto scrollbar-hide': size === 'sm',
			'flex-1 h-full overflow-hidden': size === 'full',
			'flex-1 max-w-[56rem] min-h-0 overflow-y-auto scrollbar-hide': size === 'lg',
			'max-w-max overflow-hidden': size === 'dynamic'
		},
		$$restProps.class
	)}
>
	<slot />
</div>
