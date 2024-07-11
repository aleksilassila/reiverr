<script lang="ts">
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import type { Selectable } from '../../selectable';

	let hasFocusWithin: Readable<boolean>;
	let selectable: Selectable;
	$: activeChild = selectable?.getParent()?.activeChild;
</script>

<Container
	bind:selectable
	class={classNames(
		'contents row-wrapper',
		{
			'row-wrapper-selected': $hasFocusWithin,
			'row-wrapper-active': !$hasFocusWithin && $activeChild === selectable
			// 'bg-secondary-800 shadow-xl shadow-secondary-900': $hasFocusWithin
			// 'scale-[102%] bg-primary-500/10': $hasFocusWithin
		},
		$$restProps.class
	)}
	bind:hasFocusWithin
	on:enter
	on:clickOrSelect
	focusOnClick
>
	<!-- Background, has to be inside a td to not create another column -->
	<!--	<div-->
	<!--		class={classNames('absolute inset-y-0 -inset-x-8 -z-10 rounded-xl transition-colors', {-->
	<!--			'bg-secondary-800 shadow-xl shadow-secondary-900': $hasFocusWithin,-->
	<!--			'bg-transparent': !$hasFocusWithin-->
	<!--		})}-->
	<!--	/>-->
	<slot />
</Container>
