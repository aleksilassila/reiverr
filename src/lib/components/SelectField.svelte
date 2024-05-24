<script lang="ts">
	import Container from '../../Container.svelte';
	import { ArrowRight } from 'radix-icons-svelte';
	import classNames from 'classnames';

	export let value: string;
</script>

<Container
	class="flex items-center justify-between bg-primary-900 rounded-xl px-6 py-2.5 mb-4 font-medium
		   border-2 border-transparent focus:border-primary-500 hover:border-primary-500 cursor-pointer group"
	on:clickOrSelect
	let:hasFocus
>
	<div>
		<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">
			<slot />
		</h1>
		<span>
			{value}
		</span>
	</div>
	<ArrowRight
		class={classNames('transition-transform', {
			'text-primary-500 translate-x-0.5 scale-110': hasFocus,
			'group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:scale-110': true
		})}
		size={24}
	/>
</Container>
