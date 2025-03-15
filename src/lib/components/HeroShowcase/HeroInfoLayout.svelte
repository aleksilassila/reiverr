<script lang="ts">
	import classNames from 'classnames';

	export let title = '';
	export let overview = '';
</script>

<div
	class={classNames(
		'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
		{
			'text-4xl sm:text-5xl 2xl:text-6xl': title.length || 0 < 15,
			'text-3xl sm:text-4xl 2xl:text-5xl': title.length || 0 >= 15
		}
	)}
>
	{title}
</div>
<div
	class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
/>
<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
	{overview}
</div>
