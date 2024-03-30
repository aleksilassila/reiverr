<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	let hasFoucus: Readable<boolean>;
</script>

<Container
	bind:hasFocus={hasFoucus}
	class={classNames('selectable px-6 py-2 rounded-xl font-medium tracking-wide', {
		'bg-stone-200 text-stone-900': $hasFoucus,
		'bg-stone-800 text-white': !$hasFoucus
	})}
	on:click
>
	<slot />
</Container>
