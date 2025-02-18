<script lang="ts">
	import {
		Bookmark,
		CardStack,
		DotFilled,
		Gear,
		Laptop,
		MagnifyingGlass,
		Person
	} from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { get, type Readable, writable, type Writable } from 'svelte/store';
	import Container from '../Container.svelte';
	import { registrars, Selectable } from '../../selectable';
	import { stackRouter, navigate } from '../StackRouter/StackRouter';
	import { onMount } from 'svelte';
	import { useTabs } from '../Tab/Tab';
	import { user } from '../../stores/user.store';
	import { sessions } from '../../stores/session.store';
	import { getUiVisibilityContext } from '$lib/stores/ui-visibility.store';

	enum Tabs {
		Users,
		Series,
		Movies,
		Library,
		Search,
		Manage
	}

	const tab = useTabs(Tabs.Series);

	const { visibleStyle } = getUiVisibilityContext();

	let selectedIndex = 0;
	let activeIndex = -1;

	// 	'': 0,
	// 	series: 0,
	// 	movies: 1,
	// 	library: 2,
	// 	search: 3,
	// 	manage: 4
	// }[$location.pathname.split('/')[1] || '/'];

	let isNavBarOpen: Readable<boolean>;
	let focusIndex: Writable<number> = writable(0);
	let selectable: Selectable;

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
				[Tabs.Library]: '/library',
				[Tabs.Search]: '/search',
				[Tabs.Manage]: '/manage'
			}[index] || '/';
		navigate(path);
		selectedIndex = index;
	};

	onMount(() => {
		// Set active tab based on bottommost page
		stackRouter.subscribe((r) => {
			const bottomPage = r[0];
			if (bottomPage) {
				activeIndex =
					{
						'/users': Tabs.Users,
						'/': Tabs.Series,
						'/series': Tabs.Series,
						'/movies': Tabs.Movies,
						'/library': Tabs.Library,
						'/search': Tabs.Search,
						'/manage': Tabs.Manage
					}[bottomPage.route.path] ?? -1;
				selectable.focusIndex.set(activeIndex);
				selectedIndex = activeIndex;
			}
		});
	});
</script>

<Container
	class={classNames(
		'flex flex-col items-stretch fixed z-20 left-0 inset-y-0 group',
		'py-8 w-24 select-none',
		{
			//'max-w-[64px]': !$isNavBarOpen,
			//'max-w-64': $isNavBarOpen
		}
	)}
	bind:hasFocusWithin={isNavBarOpen}
	bind:focusIndex
	bind:selectable
	on:mount={registrars.sidebar.registrar}
	style={$visibleStyle}
>
	<!-- Background -->
	<div
		class={classNames(
			'absolute inset-y-0 left-0 min-w-[40rem] w-[25vw] transition-opacity bg-gradient-to-r from-secondary-900 to-transparent',
			{
				'opacity-0': !$isNavBarOpen,
				'group-hover:opacity-100 pointer-events-none': true
			}
		)}
	/>
	<!-- Keep group hovered and sidebar open for width of this -->
	<div
		class={classNames('absolute inset-y-0 left-0 w-48 ', {
			'pointer-events-none': !$isNavBarOpen,
			'group-hover:pointer-events-auto': true
		})}
	/>

	<Container
		class="w-full h-12 cursor-pointer"
		on:clickOrSelect={() => sessions.setActiveSession()}
		let:hasFocus
	>
		<div
			class={classNames(
				'w-full h-full relative flex items-center justify-center transition-opacity',
				{
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Users),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Users),
					'opacity-0 pointer-events-none': $isNavBarOpen === false,
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
						'opacity-0 pointer-events-none': $isNavBarOpen === false,
						'group-hover:opacity-100 group-hover:pointer-events-auto': true
					}
				)}
			>
				{$user?.name}
			</span>
		</div>
	</Container>

	<div class={'flex-1 flex flex-col justify-center self-stretch'}>
		<Container
			class="w-full h-12 cursor-pointer"
			on:clickOrSelect={selectIndex(Tabs.Series)}
			let:hasFocus
			focusedChild
		>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Series),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Series)
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
							'opacity-0 pointer-events-none': $isNavBarOpen === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					Series
				</span>
			</div>
		</Container>
		<Container
			class="w-full h-12 cursor-pointer"
			on:clickOrSelect={selectIndex(Tabs.Movies)}
			let:hasFocus
		>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Movies),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Movies)
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
							'opacity-0 pointer-events-none': $isNavBarOpen === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					Movies
				</span>
			</div>
		</Container>
		<Container
			class="w-full h-12 cursor-pointer"
			on:clickOrSelect={selectIndex(Tabs.Library)}
			let:hasFocus
		>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Library),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Library)
				})}
			>
				<div class="absolute inset-y-0 left-2 flex items-center justify-center">
					<DotFilled
						class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Library })}
						size={19}
					/>
				</div>
				<Bookmark class="w-8 h-8" />
				<span
					class={classNames(
						'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
						{
							'opacity-0 pointer-events-none': $isNavBarOpen === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					Library
				</span>
			</div>
		</Container>
		<Container
			class="w-full h-12 cursor-pointer"
			on:clickOrSelect={selectIndex(Tabs.Search)}
			let:hasFocus
		>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Search),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Search)
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
							'opacity-0 pointer-events-none': $isNavBarOpen === false,
							'group-hover:opacity-100 group-hover:pointer-events-auto': true
						}
					)}
				>
					Search
				</span>
			</div>
		</Container>
	</div>

	<Container
		class="w-full h-12 cursor-pointer"
		on:clickOrSelect={selectIndex(Tabs.Manage)}
		let:hasFocus
	>
		<div
			class={classNames(
				'w-full h-full relative flex items-center justify-center transition-opacity',
				{
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === Tabs.Manage),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === Tabs.Manage),
					'opacity-0 pointer-events-none': $isNavBarOpen === false,
					'group-hover:opacity-100 group-hover:pointer-events-auto': true
				}
			)}
		>
			<div class="absolute inset-y-0 left-2 flex items-center justify-center">
				<DotFilled
					class={classNames('text-primary-500', { 'opacity-0': activeIndex !== Tabs.Manage })}
					size={19}
				/>
			</div>
			<Gear class="w-8 h-8" />
			<span
				class={classNames(
					'text-xl font-medium transition-opacity flex items-center absolute inset-y-0 left-20',
					{
						'opacity-0 pointer-events-none': $isNavBarOpen === false,
						'group-hover:opacity-100 group-hover:pointer-events-auto': true
					}
				)}
			>
				Manage
			</span>
		</div>
	</Container>
</Container>
