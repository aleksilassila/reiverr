<script lang="ts">
	import { getUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import classNames from 'classnames';
	import {
		Bookmark,
		CardStack,
		DotFilled,
		Download,
		Gear,
		Laptop,
		MagnifyingGlass,
		Person,
		Stack
	} from 'radix-icons-svelte';
	import { onMount } from 'svelte';
	import { Selectable } from '../../selectable';
	import { sessions } from '../../stores/session.store';
	import { user } from '../../stores/user.store';
	import Container from '../Container.svelte';
	import { navigate, stackRouter } from '../StackRouter/stack-router.store';
	import { useTabs } from '../Tab/Tab';
	import { sidebarRegistrar, unfocusSidebar } from './sidebar';

	// Entries are addressed by their position in the sidebar, and Server is only rendered for admins
	let Tabs = $derived({
		Users: 0,
		Series: 1,
		Movies: 2,
		MyList: 3,
		Downloads: 4,
		Search: 5,
		Server: $user?.isAdmin ? 6 : -1,
		Settings: $user?.isAdmin ? 7 : 6
	});

	const { visibleStyle } = getUiVisibilityContext();

	let selectedIndex = $state(0);
	let activeIndex = $state(-1);

	// 	'': 0,
	// 	series: 0,
	// 	movies: 1,
	// 	library: 2,
	// 	search: 3,
	// 	settings: 4
	// }[$location.pathname.split('/')[1] || '/'];

	const selectable = new Selectable();
	const focusIndex = selectable.focusIndex;

	focusIndex.subscribe((v) => {
		selectedIndex = v;
	});

	const selectIndex = (index: number) => () => {
		// if (index === activeIndex) {
		// 	if (get(selectable.hasFocusWithin)) Selectable.giveFocus('right');
		// }
		selectable.focusChild(index, { setFocusedElement: false });
		const path =
			{
				[Tabs.Users]: '/users',
				[Tabs.Series]: '/',
				[Tabs.Movies]: '/movies',
				[Tabs.MyList]: '/my-list',
				[Tabs.Downloads]: '/downloads',
				[Tabs.Search]: '/search',
				[Tabs.Server]: '/server',
				[Tabs.Settings]: '/settings'
			}[index] || '/';
		navigate(path);
		selectedIndex = index;
	};

	onMount(() => {
		// Set active tab based on bottommost page
		stackRouter.subscribe((r) => {
			const initialUri = window.location.pathname;
			const uri = initialUri === '/' ? '/' : `/${initialUri.split('/')[1]}`;

			// const bottomPage = r[0];
			// if (bottomPage) {
			activeIndex =
				{
					'/users': Tabs.Users,
					'/': Tabs.Series,
					'/series': Tabs.Series,
					'/movies': Tabs.Movies,
					'/my-list': Tabs.MyList,
					'/downloads': Tabs.Downloads,
					'/search': Tabs.Search,
					'/server': Tabs.Server,
					'/settings': Tabs.Settings
				}[uri] ?? -1;
			selectable.focusIndex.set(activeIndex);
			selectedIndex = activeIndex;
			// }
		});
	});
</script>

<Container
	class={classNames(
		'flex flex-col items-stretch fixed z-20 left-0 inset-y-0 group',
		'py-8 w-24 select-none'
	)}
	{selectable}
	onNavigate={(e) => {
		// if (e.direction === 'right') {
		// 	e.preventNavigation();
		// 	// unfocusSidebar();
		// }
	}}
	onBack={() => unfocusSidebar()}
	onMounted={sidebarRegistrar.registrar}
	style={$visibleStyle}
>
	{#snippet children({ hasFocusWithin })}
		<!-- Background -->
		<div
			class={classNames(
				'absolute inset-y-0 left-0 min-w-[40rem] w-[25vw] transition-opacity bg-gradient-to-r from-secondary-900 to-transparent',
				{
					'opacity-0': !hasFocusWithin,
					'group-hover:opacity-100 pointer-events-none': true
				}
			)}
		></div>
		<!-- Keep group hovered and sidebar open for width of this -->
		<div
			class={classNames('absolute inset-y-0 left-0 w-48 ', {
				'pointer-events-none': !hasFocusWithin,
				'group-hover:pointer-events-auto': true
			})}
		></div>

		<Container
			class="w-full h-12 cursor-pointer"
			onClickOrSelect={() => sessions.setActiveSession()}
		>
			{#snippet children({ hasFocus })}
				<div
					class={classNames(
						'w-full h-full relative flex items-center justify-center transition-opacity',
						{
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Users),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Users),
							'opacity-0 pointer-events-none': hasFocusWithin === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					<div class="absolute inset-y-0 left-2 flex items-center justify-center">
						<DotFilled
							class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Users })}
							size={19}
						/>
					</div>
					<Person class="w-8 h-8" />
					<span
						class={classNames(
							'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20 text-nowrap',
							{
								'opacity-0 pointer-events-none': hasFocusWithin === false,
								'group-hover:opacity-100 group-hover:pointer-events-auto': true
							}
						)}
					>
						{$user?.name}
					</span>
				</div>
			{/snippet}
		</Container>

		<div class="flex-1 flex flex-col justify-center self-stretch">
			<Container
				class="w-full h-12 cursor-pointer"
				onClickOrSelect={selectIndex(Tabs.Series)}
				focusedChild
			>
				{#snippet children({ hasFocus })}
					<div
						class={classNames('w-full h-full relative flex items-center justify-center', {
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Series),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Series)
						})}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Series })}
								size={19}
							/>
						</div>
						<Laptop class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							Series
						</span>
					</div>
				{/snippet}
			</Container>
			<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.Movies)}>
				{#snippet children({ hasFocus })}
					<div
						class={classNames('w-full h-full relative flex items-center justify-center', {
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Movies),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Movies)
						})}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Movies })}
								size={19}
							/>
						</div>
						<CardStack class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							Movies
						</span>
					</div>
				{/snippet}
			</Container>
			<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.MyList)}>
				{#snippet children({ hasFocus })}
					<div
						class={classNames('w-full h-full relative flex items-center justify-center', {
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.MyList),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.MyList)
						})}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.MyList })}
								size={19}
							/>
						</div>
						<Bookmark class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20 whitespace-nowrap',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							My List
						</span>
					</div>
				{/snippet}
			</Container>
			<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.Downloads)}>
				{#snippet children({ hasFocus })}
					<div
						class={classNames('w-full h-full relative flex items-center justify-center', {
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Downloads),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Downloads)
						})}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', {
									'opacity-0': activeIndex !== Tabs.Downloads
								})}
								size={19}
							/>
						</div>
						<Download class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							Downloads
						</span>
					</div>
				{/snippet}
			</Container>
			<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.Search)}>
				{#snippet children({ hasFocus })}
					<div
						class={classNames('w-full h-full relative flex items-center justify-center', {
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Search),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Search)
						})}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Search })}
								size={19}
							/>
						</div>
						<MagnifyingGlass class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							Search
						</span>
					</div>
				{/snippet}
			</Container>
		</div>

		{#if $user?.isAdmin}
			<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.Server)}>
				{#snippet children({ hasFocus })}
					<div
						class={classNames(
							'w-full h-full relative flex items-center justify-center transition-opacity',
							{
								'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Server),
								'text-stone-300 hover:text-primary-500':
									!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Server),
								'opacity-0 pointer-events-none': hasFocusWithin === false,
								'group-hover:opacity-100 group-hover:pointer-events-auto': true
							}
						)}
					>
						<div class="absolute inset-y-0 left-2 flex items-center justify-center">
							<DotFilled
								class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Server })}
								size={19}
							/>
						</div>
						<Stack class="w-8 h-8" />
						<span
							class={classNames(
								'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
								{
									'opacity-0 pointer-events-none': hasFocusWithin === false,
									'group-hover:opacity-100 group-hover:pointer-events-auto': true
								}
							)}
						>
							Server
						</span>
					</div>
				{/snippet}
			</Container>
		{/if}
		<Container class="w-full h-12 cursor-pointer" onClickOrSelect={selectIndex(Tabs.Settings)}>
			{#snippet children({ hasFocus })}
				<div
					class={classNames(
						'w-full h-full relative flex items-center justify-center transition-opacity',
						{
							'text-primary-500': hasFocus || (!hasFocusWithin && selectedIndex === Tabs.Settings),
							'text-stone-300 hover:text-primary-500':
								!hasFocus && !(!hasFocusWithin && selectedIndex === Tabs.Settings),
							'opacity-0 pointer-events-none': hasFocusWithin === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					<div class="absolute inset-y-0 left-2 flex items-center justify-center">
						<DotFilled
							class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Settings })}
							size={19}
						/>
					</div>
					<Gear class="w-8 h-8" />
					<span
						class={classNames(
							'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
							{
								'opacity-0 pointer-events-none': hasFocusWithin === false,
								'group-hover:opacity-100 group-hover:pointer-events-auto': true
							}
						)}
					>
						Settings
					</span>
				</div>
			{/snippet}
		</Container>
	{/snippet}
</Container>
