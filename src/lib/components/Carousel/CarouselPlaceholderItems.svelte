<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import { Container } from '../../actions/focusAction';
	import classNames from 'classnames';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let orientation: 'landscape' | 'portrait' = 'landscape';

	export let container: Container;
	let carousel = container.createChild('carousel').setDirection('horizontal');
	let focusIndexStore = carousel.focusIndex;
	let focusWithinStore = carousel.hasFocusWithin;

	Container.focusedObject.subscribe((fo) => console.log('focusedObject', fo));
	carousel.hasFocus.subscribe((hf) => console.log('hasFocus', hf));

	let registerer = carousel.getChildRegisterer();
</script>

<p
	class={classNames({
		'bg-blue-500': $focusWithinStore
	})}
>
	Index: {$focusIndexStore}
</p>

{#each Array(10) as _, i (i)}
	<div
		tabindex="0"
		use:registerer
		class={classNames({
			'bg-red-500': $focusIndexStore === i && $focusWithinStore
		})}
	>
		<CardPlaceholder {size} index={i} {orientation} />
	</div>
{/each}
