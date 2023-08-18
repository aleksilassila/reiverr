<script lang="ts">
	import classNames from 'classnames';

	export let type: 'text' | 'number' = 'text';
	export let value: any = type === 'text' ? '' : 0;
	export let placeholder = '';

	const baseStyles =
		'appearance-none p-1 px-3 selectable border border-zinc-800 rounded-lg bg-zinc-600 bg-opacity-20 text-zinc-200';
</script>

<div class="relative">
	{#if type === 'text'}
		<input type="text" {placeholder} bind:value class={classNames(baseStyles, $$restProps.class)} />
	{:else if type === 'number'}
		<input
			type="number"
			{placeholder}
			bind:value
			class={classNames(baseStyles, 'w-28', $$restProps.class)}
		/>
	{/if}
</div>
