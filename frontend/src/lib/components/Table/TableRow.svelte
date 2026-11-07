<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	interface Props {
		onEnter?: ContainerProps['onEnter'];
		children?: Snippet;
		class?: string;
	}

	let { children, onEnter, class: className }: Props = $props();

	const selectable = new Selectable();
	const hasFocusWithin = selectable.hasFocusWithin;
</script>

<Container
	class={classNames(
		'contents row-wrapper',
		{
			'row-wrapper-selected': $hasFocusWithin
			// 'bg-secondary-800 shadow-xl shadow-secondary-900': $hasFocusWithin
			// 'scale-[102%] bg-primary-500/10': $hasFocusWithin
		},
		className
	)}
	{selectable}
	{onEnter}
>
	<!-- Background, has to be inside a td to not create another column -->
	<!--	<div-->
	<!--		class={classNames('absolute inset-y-0 -inset-x-8 -z-10 rounded-xl transition-colors', {-->
	<!--			'bg-secondary-800 shadow-xl shadow-secondary-900': $hasFocusWithin,-->
	<!--			'bg-transparent': !$hasFocusWithin-->
	<!--		})}-->
	<!--	/>-->
	{@render children?.()}
</Container>
