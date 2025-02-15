<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Container from './Container.svelte';
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';

	type Option = {
		label: string;
		value?: string;
		disabled?: boolean;
	};

	export let options: Option[] = [];
	export let selected: string | undefined = undefined;
	export let name: string | undefined = undefined;
	export let style: 'primary' | 'secondary' = 'secondary';

	const dispatch = createEventDispatcher<{
		select: string;
	}>();
</script>

<div>
	{#if name}
		<h2 class="font-semibold text-sm text-secondary-400 mb-2">{name}</h2>
	{/if}
	<Container
		direction="vertical"
		class={classNames(
			'rounded-xl',
			{
				'bg-primary-900': style === 'secondary',
				'bg-secondary-800': style === 'primary'
			},
			$$restProps.class
		)}
	>
		{#each options as option, index}
			{@const first = index === 0}
			{@const last = index === options.length - 1}
			{#if !first}
				<div class="h-[1px] w-full bg-secondary-700" />
			{/if}
			<Container
				on:clickOrSelect={() => dispatch('select', option.value ?? option.label)}
				let:hasFocus
				class="group"
			>
				<div
					class={classNames('h-12 px-6 py-3 border-2 flex items-center justify-between', {
						'cursor-pointer border-transparent group-focus-within:border-primary-500 hover:border-primary-500':
							!option.disabled,
						'cursor-not-allowed pointer-events-none opacity-40': option.disabled,
						'rounded-t-xl': first,
						'rounded-b-xl': last
					})}
				>
					<span class="font-medium">{option.label}</span>
					{#if selected === option.value}
						<Check size={24} />
					{/if}
				</div>
			</Container>
		{/each}
	</Container>
</div>
