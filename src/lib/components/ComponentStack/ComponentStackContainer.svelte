<!-- The purpose of this component is to make contexts available to ComponentStack children. -->
<script lang="ts">
	import { getContext, type ComponentProps } from 'svelte';
	import type { Readable } from 'svelte/store';
	import Container from '../Container.svelte';
	import ComponentStackItem from './ComponentStackItem.svelte';
	import classNames from 'classnames';

	export let trapFocus = false;
	export let hideSidebar = false;

	const props = getContext<Readable<ComponentProps<ComponentStackItem> & { hidden: boolean }>>(
		'component-stack-container'
	);
</script>

<Container
	disabled={$props.hidden}
	focusOnMount={!$props.hidden}
	{trapFocus}
	class={classNames('fixed inset-0 overflow-x-hidden overflow-y-auto scrollbar-hide', {
		'z-[21]': hideSidebar,
		'opacity-0': $props.hidden
	})}
	style="backface-visibility: hidden"
>
	<slot />
</Container>

<ComponentStackItem {...$props} />
