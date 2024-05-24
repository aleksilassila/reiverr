<script lang="ts">
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import type { Selectable } from '../../selectable';

	export let tab: number;
	export let index: number = tab;
	export let openTab: number;

	let selectable: Selectable;

	$: active = tab === openTab;
	$: if (active) selectable?.focus();
</script>

<Container
	trapFocus
	class={classNames($$restProps.class, 'transition-all', {
		'opacity-0 pointer-events-none': !active,
		'-translate-x-10': !active && openTab >= index,
		'translate-x-10': !active && openTab < index
	})}
	bind:selectable
	on:back
>
	<slot />
</Container>
