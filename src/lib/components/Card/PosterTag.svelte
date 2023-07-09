<script>
	import classNames from 'classnames';

	export let value = '';
	export let filled = false;
</script>

<div
	class={classNames('border rounded p-[0px] px-1 text-[10px] font-medium', {
		'text-zinc-200 border-zinc-500': !filled,
		'bg-zinc-200 border-zinc-200 text-zinc-900': filled
	})}
>
	{value}
</div>
