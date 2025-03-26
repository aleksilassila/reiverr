<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { useTabs } from '$lib/components/Tab/Tab';
	import Tab from '$lib/components/Tab/Tab.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import TabSelect from '$lib/components/Tab/TabSelect.svelte';
	import { sources } from '$lib/stores/user.store';
	import classNames from 'classnames';
	import MyListTab from './MyListTab.svelte';

	const tab = useTabs(0, { remount: true });

	const catalogues = $sources
		.filter((s) => s.capabilities.movieIndexing || s.capabilities.episodeIndexing)
		.map((s) => s.source);
</script>

<Container class="pt-16 space-y-8 min-h-screen flex flex-col" let:hasFocus focusOnMount>
	<Container direction="horizontal" class="flex space-x-4 px-32">
		<TabSelect tabValue={0} {...tab} let:hasFocus let:isActive>
			<span
				class={classNames('font-semibold text-2xl group-focus-within:text-primary-500', {
					'text-secondary-50': isActive && !hasFocus,
					'text-secondary-400': !isActive && !hasFocus,
					'text-primary-500': isActive && hasFocus
				})}
			>
				My List
			</span>
		</TabSelect>
		{#each catalogues as catalogue, index}
			<TabSelect tabValue={index + 1} {...tab} let:hasFocus let:isActive>
				<span
					class={classNames('font-semibold text-2xl group-focus-within:text-primary-500', {
						'text-secondary-50': isActive && !hasFocus,
						'text-secondary-400': !isActive && !hasFocus,
						'text-primary-500': isActive && hasFocus
					})}
				>
					{catalogue.name}
				</span>
			</TabSelect>
		{/each}
	</Container>
	<TabContainer class="flex-1">
		<Tab tab={0} {...tab}>
			<MyListTab />
		</Tab>
		{#each catalogues as catalogue, index}
			<Tab tab={index + 1} {...tab}>
				<Container>
					{catalogue.name}
				</Container>
			</Tab>
		{/each}
	</TabContainer>
</Container>
