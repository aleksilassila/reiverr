<script lang="ts">
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import classNames from 'classnames';
	import Container from './Container.svelte';

	export let type: 'transparent' = 'transparent';
	export let focusOnMount = false;
</script>

<!-- The row above the focused one is kept in view, so that the list does not sit flush at the top -->
<Container
	on:enter={({ detail }) => {
		const el =
			detail.selectable.getSibling(-1)?.getHtmlElement() ?? detail.selectable.getHtmlElement();

		if (el) scrollElementIntoView(el, { top: 32 });
	}}
	on:select
	on:click
	on:clickOrSelect
	on:navigate
	{focusOnMount}
	focusOnClick
	let:hasFocus
>
	<div
		class={classNames(
			'cursor-pointer select-none flex items-center rounded-xl px-6 py-2.5 border-2 group',
			{
				'border-transparent text-secondary-200 hover:border-secondary-700/50 hover:bg-secondary-700/50 hover:text-secondary-100':
					type === 'transparent' && !hasFocus,
				'border-secondary-700/50 bg-secondary-700/50 text-secondary-100':
					type === 'transparent' && hasFocus
			}
		)}
	>
		<slot {hasFocus} />
	</div>
</Container>
