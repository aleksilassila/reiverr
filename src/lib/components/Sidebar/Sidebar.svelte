<script lang="ts">
	import {
		Bookmark,
		CardStack,
		DotFilled,
		Gear,
		Laptop,
		MagnifyingGlass
	} from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { get, type Readable, writable, type Writable } from 'svelte/store';
	import Container from '../../../Container.svelte';
	import { useLocation, useNavigate } from 'svelte-navigator';
	import { registrars, Selectable } from '../../selectable';

	const location = useLocation();
	const navigate = useNavigate();
	let selectedIndex = 0;
	$: activeIndex = {
		'': 0,
		series: 0,
		movies: 1,
		library: 2,
		search: 3,
		manage: 4
	}[$location.pathname.split('/')[1] || '/'];

	$: console.log('activeIndex', activeIndex);
	$: console.log($location.pathname.split('/')[1] || '/');
	let isNavBarOpen: Readable<boolean>;
	let focusIndex: Writable<number> = writable(0);
	let selectable: Selectable;

	focusIndex.subscribe((v) => (selectedIndex = v));

	const selectIndex = (index: number) => () => {
		if (index === activeIndex) {
			if (get(selectable.hasFocusWithin)) Selectable.giveFocus('right');
			return;
		}
		selectable.focusChild(index);
		const path =
			{
				0: '/',
				1: 'movies',
				2: 'library',
				3: 'search',
				4: 'manage'
			}[index] || '/';
		navigate(path);
		selectedIndex = index;
	};
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
>
	<!-- Background -->
	<div
		class={classNames(
			'absolute inset-y-0 left-0 w-[25vw] transition-opacity bg-gradient-to-r from-secondary-900 to-transparent',
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

	<div class={'flex-1 flex flex-col justify-center self-stretch'}>
		<Container class="w-full h-12 cursor-pointer" on:clickOrSelect={selectIndex(0)} let:hasFocus>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === 0),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === 0)
				})}
			>
				<div class="absolute inset-y-0 left-2 flex items-center justify-center">
					<DotFilled
						class={classNames('text-primary-500', { 'opacity-0': activeIndex !== 0 })}
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
		<Container class="w-full h-12 cursor-pointer" on:clickOrSelect={selectIndex(1)} let:hasFocus>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === 1),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === 1)
				})}
			>
				<div class="absolute inset-y-0 left-2 flex items-center justify-center">
					<DotFilled
						class={classNames('text-primary-500', { 'opacity-0': activeIndex !== 1 })}
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
		<Container class="w-full h-12 cursor-pointer" on:clickOrSelect={selectIndex(2)} let:hasFocus>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === 2),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === 2)
				})}
			>
				<div class="absolute inset-y-0 left-2 flex items-center justify-center">
					<DotFilled
						class={classNames('text-primary-500', { 'opacity-0': activeIndex !== 2 })}
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
		<Container class="w-full h-12 cursor-pointer" on:clickOrSelect={selectIndex(3)} let:hasFocus>
			<div
				class={classNames('w-full h-full relative flex items-center justify-center', {
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === 3),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === 3)
				})}
			>
				<div class="absolute inset-y-0 left-2 flex items-center justify-center">
					<DotFilled
						class={classNames('text-primary-500', { 'opacity-0': activeIndex !== 3 })}
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

	<Container class="w-full h-12 cursor-pointer" on:clickOrSelect={selectIndex(4)} let:hasFocus>
		<div
			class={classNames(
				'w-full h-full relative flex items-center justify-center transition-opacity',
				{
					'text-primary-500': hasFocus || (!$isNavBarOpen && selectedIndex === 4),
					'text-stone-300 hover:text-primary-500':
						!hasFocus && !(!$isNavBarOpen && selectedIndex === 4),
					'opacity-0 pointer-events-none': $isNavBarOpen === false,
					'group-hover:opacity-100 group-hover:pointer-events-auto': true
				}
			)}
		>
			<div class="absolute inset-y-0 left-2 flex items-center justify-center">
				<DotFilled
					class={classNames('text-primary-500', { 'opacity-0': activeIndex !== 4 })}
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
	<!--	<div class={'flex flex-col flex-1 relative z-20 items-center'}>-->
	<!--		<div class={'flex flex-col flex-1 justify-center self-stretch'}>-->
	<!--			<Container-->
	<!--				class={classNames(itemContainer(0, $focusIndex), 'w-full flex justify-center')}-->
	<!--				on:clickOrSelect={selectIndex(0)}-->
	<!--			>-->
	<!--				<Laptop class="w-8 h-8" />-->
	<!--			</Container>-->
	<!--			<Container-->
	<!--				class={classNames(itemContainer(1, $focusIndex), 'w-full flex justify-center')}-->
	<!--				on:clickOrSelect={selectIndex(1)}-->
	<!--			>-->
	<!--				<CardStack class="w-8 h-8" />-->
	<!--			</Container>-->
	<!--			<Container-->
	<!--				class={classNames(itemContainer(2, $focusIndex), 'w-full flex justify-center')}-->
	<!--				on:clickOrSelect={selectIndex(2)}-->
	<!--			>-->
	<!--				<Bookmark class="w-8 h-8" />-->
	<!--			</Container>-->
	<!--			<Container-->
	<!--				class={classNames(itemContainer(3, $focusIndex), 'w-full flex justify-center')}-->
	<!--				on:clickOrSelect={selectIndex(3)}-->
	<!--			>-->
	<!--				<MagnifyingGlass class="w-8 h-8" />-->
	<!--			</Container>-->
	<!--		</div>-->

	<!--		<Container-->
	<!--			class={classNames(itemContainer(4, $focusIndex), 'w-full flex justify-center')}-->
	<!--			on:clickOrSelect={selectIndex(4)}-->
	<!--		>-->
	<!--			<Gear class="w-8 h-8" />-->
	<!--		</Container>-->
	<!--	</div>-->

	<!--	<div-->
	<!--		class={classNames(-->
	<!--			'absolute inset-y-0 left-0 pl-[64px] pr-96 z-10 transition-all bg-gradient-to-r from-secondary-500 to-transparent',-->
	<!--			'flex flex-col flex-1 p-4',-->
	<!--			{-->
	<!--				// 'translate-x-full opacity-100': $isNavBarOpen,-->
	<!--				'opacity-0 pointer-events-none': !$isNavBarOpen,-->
	<!--				'group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto': true-->
	<!--			}-->
	<!--		)}-->
	<!--	>-->
	<!--		<div class="flex flex-col flex-1 justify-center">-->
	<!--			&lt;!&ndash; svelte-ignore a11y-click-events-have-key-events &ndash;&gt;-->
	<!--			<div class={itemContainer(0, $focusIndex)} on:click={selectIndex(0)}>-->
	<!--				<span-->
	<!--					class={classNames('text-xl transition-opacity font-medium', {-->
	<!--						// 'opacity-0': $isNavBarOpen === false-->
	<!--					})}-->
	<!--				>-->
	<!--					Series</span-->
	<!--				>-->
	<!--			</div>-->
	<!--			&lt;!&ndash; svelte-ignore a11y-click-events-have-key-events &ndash;&gt;-->
	<!--			<div class={itemContainer(1, $focusIndex)} on:click={selectIndex(1)}>-->
	<!--				<span-->
	<!--					class={classNames('text-xl transition-opacity font-medium', {-->
	<!--						// 'opacity-0': $isNavBarOpen === false-->
	<!--					})}-->
	<!--				>-->
	<!--					Movies</span-->
	<!--				>-->
	<!--			</div>-->
	<!--			&lt;!&ndash; svelte-ignore a11y-click-events-have-key-events &ndash;&gt;-->
	<!--			<div class={itemContainer(2, $focusIndex)} on:click={selectIndex(2)}>-->
	<!--				<span-->
	<!--					class={classNames('text-xl transition-opacity font-medium', {-->
	<!--						// 'opacity-0': $isNavBarOpen === false-->
	<!--					})}-->
	<!--				>-->
	<!--					Library</span-->
	<!--				>-->
	<!--			</div>-->
	<!--			&lt;!&ndash; svelte-ignore a11y-click-events-have-key-events &ndash;&gt;-->
	<!--			<div class={itemContainer(3, $focusIndex)} on:click={selectIndex(3)}>-->
	<!--				<span-->
	<!--					class={classNames('text-xl transition-opacity font-medium', {-->
	<!--						// 'opacity-0': $isNavBarOpen === false-->
	<!--					})}-->
	<!--				>-->
	<!--					Search</span-->
	<!--				>-->
	<!--			</div>-->
	<!--		</div>-->

	<!--		&lt;!&ndash; svelte-ignore a11y-click-events-have-key-events &ndash;&gt;-->
	<!--		<div class={itemContainer(4, $focusIndex)} on:click={selectIndex(4)}>-->
	<!--			<span-->
	<!--				class={classNames('text-xl transition-opacity font-medium', {-->
	<!--					// 'opacity-0': $isNavBarOpen === false-->
	<!--				})}-->
	<!--			>-->
	<!--				Manage</span-->
	<!--			>-->
	<!--		</div>-->
	<!--	</div>-->
</Container>
