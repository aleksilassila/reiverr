<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	export let selected = false;

	const dispatch = createEventDispatcher<{ select: null }>();
</script>

<Container
	class="group cursor-pointer"
	let:hasFocus
	on:clickOrSelect={() => dispatch('select')}
	focusOnClick
>
	<span
		class={classNames('font-semibold text-2xl group-focus-within:text-primary-500', {
			'text-secondary-50': selected && !hasFocus,
			'text-secondary-400': !hasFocus && !selected
		})}
	>
		<slot />
	</span>
</Container>
