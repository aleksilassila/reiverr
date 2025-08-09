<script lang="ts">
	import Container from './Container.svelte';
	import { ArrowRight, Check } from 'radix-icons-svelte';
	import classNames from 'classnames';

	export let selected: boolean;
</script>

<Container
	class="flex items-center justify-between bg-primary-900 rounded-xl px-6 py-2.5 font-medium
		   border-2 border-transparent focus:border-primary-500 hover:border-primary-500 cursor-pointer group"
	on:clickOrSelect
	on:enter
	focusOnClick
	focusOnMount={selected}
>
	<div>
		<slot />
	</div>
	{#if selected}
		<Check size={24} />
	{/if}
</Container>
