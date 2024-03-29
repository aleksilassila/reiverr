<script lang="ts">
	import { Bookmark, CardStack, Gear, Laptop, MagnifyingGlass } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import type { Readable } from 'svelte/store';
	import Container from '../../../Container.svelte';
	import { useNavigate } from 'svelte-navigator';

	let isNavBarOpen: Readable<boolean>;
	let focusIndex: Readable<number>;

	const navigate = useNavigate();
	const asd = '';
	const asd2 = '';
	const itemContainer = (index: number, _focusIndex: number) =>
		classNames('h-12 flex items-center', {
			'text-amber-300': _focusIndex === index,
			'text-stone-300': _focusIndex !== index
		});
</script>

<Container
	class={classNames('flex items-stretch fixed z-20 left-0 inset-y-0', 'py-4 w-16', {
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
		<div class={'flex flex-col flex-1 justify-center'}>
			<Container on:click={() => navigate('/')}>
				<div class={itemContainer(0, $focusIndex)}>
					<Laptop class="w-8 h-8" slot="icon" />
				</div>
			</Container>
			<Container on:click={() => navigate('/movie/76600')}>
				<div class={itemContainer(1, $focusIndex)}>
					<CardStack class="w-8 h-8" slot="icon" />
				</div>
			</Container>
			<Container on:click={() => navigate('library')}>
				<div class={itemContainer(2, $focusIndex)}>
					<Bookmark class="w-8 h-8" slot="icon" />
				</div>
			</Container>
			<Container on:click={() => navigate('search')}>
				<div class={itemContainer(3, $focusIndex)}>
					<MagnifyingGlass class="w-8 h-8" slot="icon" />
				</div>
			</Container>
		</div>

		<Container on:click={() => navigate('manage')}>
			<div class={itemContainer(4, $focusIndex)}>
				<Gear class="w-8 h-8" slot="icon" />
			</div>
		</Container>
	</div>

	<div
		class={classNames(
			'absolute inset-y-0 left-0 pl-[64px] pr-10 z-10 transition-all bg-stone-900',
			'flex flex-col flex-1 p-4',
			{
				'opacity-0': $isNavBarOpen === false,
				'-translate-x-1/4': $isNavBarOpen === false
			}
		)}
	>
		<div class="flex flex-col flex-1 justify-center">
			<div class={itemContainer(0, $focusIndex)}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						'opacity-0': $isNavBarOpen === false
					})}
				>
					Series</span
				>
			</div>
			<div class={itemContainer(1, $focusIndex)}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						'opacity-0': $isNavBarOpen === false
					})}
				>
					Movies</span
				>
			</div>
			<div class={itemContainer(2, $focusIndex)}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						'opacity-0': $isNavBarOpen === false
					})}
				>
					Library</span
				>
			</div>
			<div class={itemContainer(3, $focusIndex)}>
				<span
					class={classNames('text-xl transition-opacity font-medium', {
						'opacity-0': $isNavBarOpen === false
					})}
				>
					Search</span
				>
			</div>
		</div>

		<div class={itemContainer(4, $focusIndex)}>
			<span
				class={classNames('text-xl transition-opacity font-medium', {
					'opacity-0': $isNavBarOpen === false
				})}
			>
				Manage</span
			>
		</div>
	</div>
</Container>
