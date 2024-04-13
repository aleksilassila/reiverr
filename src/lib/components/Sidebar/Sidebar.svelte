<script lang="ts">
	import { Bookmark, CardStack, Gear, Laptop, MagnifyingGlass } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import type { Readable, Writable } from 'svelte/store';
	import Container from '../../../Container.svelte';
	import { useNavigate } from 'svelte-navigator';

	let isNavBarOpen: Readable<boolean>;
	let focusIndex: Writable<number>;

	const navigate = useNavigate();
	const itemContainer = (index: number, _focusIndex: number) =>
		classNames('h-12 flex items-center cursor-pointer', {
			'text-amber-300': _focusIndex === index,
			'text-stone-300': _focusIndex !== index
		});
</script>

<Container
	class={classNames('flex items-stretch fixed z-20 left-0 inset-y-0 group', 'py-4 w-16', {
		//'max-w-[64px]': !$isNavBarOpen,
		//'max-w-64': $isNavBarOpen
	})}
	bind:hasFocusWithin={isNavBarOpen}
	bind:focusIndex
>
	<!--	<div>-->
	<!--		<Link to="" class="rounded-sm flex items-center">-->
	<!--			<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />-->
	<!--			<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>-->
	<!--		</Link>-->
	<!--	</div>-->

	<div class={'flex flex-col flex-1 relative z-20 items-center'}>
		<div class={'flex flex-col flex-1 justify-center self-stretch'}>
			<Container
				class={classNames(itemContainer(0, $focusIndex), 'w-full flex justify-center')}
				on:clickOrSelect={() => navigate('/')}
			>
				<Laptop class="w-8 h-8" />
			</Container>
			<Container
				class={classNames(itemContainer(1, $focusIndex), 'w-full flex justify-center')}
				on:clickOrSelect={() => navigate('movies')}
			>
				<CardStack class="w-8 h-8" />
			</Container>
			<Container
				class={classNames(itemContainer(2, $focusIndex), 'w-full flex justify-center')}
				on:clickOrSelect={() => navigate('library')}
			>
				<Bookmark class="w-8 h-8" />
			</Container>
			<Container
				class={classNames(itemContainer(3, $focusIndex), 'w-full flex justify-center')}
				on:clickOrSelect={() => navigate('search')}
			>
				<MagnifyingGlass class="w-8 h-8" />
			</Container>
		</div>

		<Container
			class={classNames(itemContainer(4, $focusIndex), 'w-full flex justify-center')}
			on:clickOrSelect={() => navigate('manage')}
		>
			<Gear class="w-8 h-8" />
		</Container>
	</div>

	<div
		class={classNames(
			'absolute inset-y-0 right-full pl-[64px] pr-10 z-10 transition-all bg-stone-900/90',
			'flex flex-col flex-1 p-4 opacity-0',
			{
				'translate-x-full opacity-100': $isNavBarOpen,
				'group-hover:translate-x-full group-hover:opacity-100': true
			}
		)}
	>
		<div class="flex flex-col flex-1 justify-center">
			<div class={itemContainer(0, $focusIndex)} on:click={() => navigate('/')}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						// 'opacity-0': $isNavBarOpen === false
					})}
				>
					Series</span
				>
			</div>
			<div class={itemContainer(1, $focusIndex)} on:click={() => navigate('movies')}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						// 'opacity-0': $isNavBarOpen === false
					})}
				>
					Movies</span
				>
			</div>
			<div class={itemContainer(2, $focusIndex)} on:click={() => navigate('library')}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						// 'opacity-0': $isNavBarOpen === false
					})}
				>
					Library</span
				>
			</div>
			<div class={itemContainer(3, $focusIndex)} on:click={() => navigate('search')}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						// 'opacity-0': $isNavBarOpen === false
					})}
				>
					Search</span
				>
			</div>
		</div>

		<div class={itemContainer(4, $focusIndex)} on:click={() => navigate('manage')}>
			<span
				class={classNames('text-xl transition-opacity font-medium', {
					// 'opacity-0': $isNavBarOpen === false
				})}
			>
				Manage</span
			>
		</div>
	</div>
</Container>
