<script lang="ts">
	import classNames from 'classnames';

	export let title: string | undefined;
</script>

<div
	class={classNames(
		'text-left font-medium tracking-wider text-zinc-200 hover:text-amber-200 mt-1',
		{
			'text-4xl sm:text-5xl lg:text-6xl': (title?.length || 0) < 15,
			'text-3xl sm:text-4xl lg:text-5xl': (title?.length || 0) >= 15
		}
	)}
>
	{title}
</div>
