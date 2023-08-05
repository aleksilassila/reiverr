<script>
	import classNames from 'classnames';

	export let disabled = false;
</script>

<button
	class={classNames(
		'text-zinc-300 hover:text-zinc-50 p-1 flex items-center justify-center selectable rounded-sm',
		{
			'opacity-30 cursor-not-allowed pointer-events-none': disabled,
			'cursor-pointer': !disabled
		}
	)}
	on:click|stopPropagation
>
	<slot />
</button>
