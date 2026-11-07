<script lang="ts">
	import classNames from 'classnames';
	import type { IconComponent } from '$lib/components/icon.type';

	interface Props {
		/** Without a label, the tag is its icon alone */
		label?: string;
		icon?: IconComponent | undefined;
		type?: 'default' | 'secondary' | 'progress' | 'error';
		size?: 'sm' | 'md';
		title?: string;
		class?: string;
	}

	let {
		label = '',
		icon = undefined,
		type = 'default',
		size = 'md',
		title = '',
		class: className
	}: Props = $props();
</script>

<div
	class={classNames(
		'flex items-center flex-shrink-0 font-semibold tabular-nums whitespace-nowrap',
		{
			'h-9 px-3 rounded-lg text-lg': size === 'md',
			'h-6 px-2 rounded-md text-xs': size === 'sm',
			'bg-primary-500/30 text-primary-200': type === 'default',
			'bg-secondary-400/25 text-secondary-100': type === 'secondary',
			'bg-purple-500/30 text-purple-200': type === 'progress',
			'bg-red-500/30 text-red-200': type === 'error'
		},
		className
	)}
	title={title || label}
>
	{#if icon}
		{@const SvelteComponent = icon}
		<SvelteComponent
			size={size === 'md' ? 20 : 14}
			class={classNames('flex-shrink-0', {
				'mr-2': label && size === 'md',
				'mr-1': label && size === 'sm'
			})}
		/>
	{/if}
	{label}
</div>
