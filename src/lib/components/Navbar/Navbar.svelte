<script lang="ts">
	import { MagnifyingGlass, Person } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { page } from '$app/stores';
	import TitleSearchModal from './TitleSearchModal.svelte';
	import IconButton from '../IconButton.svelte';

	let y = 0;
	let transparent = true;
	let baseStyle = '';

	let isSearchVisible = false;

	function getLinkStyle(path: string) {
		return classNames('selectable rounded-sm px-2 -mx-2', {
			'text-amber-200': $page.url.pathname === path,
			'hover:text-zinc-50 cursor-pointer': $page.url.pathname !== path
		});
	}

	// TODO: on mobile don't act sticky
	$: {
		transparent = y <= 0;
		baseStyle = classNames(
			'fixed px-8 inset-x-0 grid grid-cols-[min-content_1fr_min-content] items-center z-10',
			'transition-all',
			{
				'bg-stone-900 bg-opacity-50 backdrop-blur-2xl h-16': !transparent,
				'h-24': transparent
			}
		);
	}
</script>

<svelte:window bind:scrollY={y} />

<div class={baseStyle}>
	<a href="/" class="flex gap-2 items-center hover:text-inherit selectable rounded-sm px-2 -mx-2">
		<div class="rounded-full bg-amber-300 h-4 w-4" />
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</a>
	<div
		class="flex items-center justify-center gap-8 font-normal text-sm tracking-wider text-zinc-200"
	>
		<a href="/" class={$page && getLinkStyle('/')}>Home</a>
		<a href="/discover" class={$page && getLinkStyle('/discover')}>Discover</a>
		<a href="/library" class={$page && getLinkStyle('/library')}>Library</a>
		<a href="/sources" class={$page && getLinkStyle('/sources')}>Sources</a>
		<a href="/settings" class={$page && getLinkStyle('/settings')}>Settings</a>
	</div>
	<div class="flex gap-2 items-center">
		<IconButton on:click={() => (isSearchVisible = true)}>
			<MagnifyingGlass size={20} />
		</IconButton>
		<IconButton>
			<Person size={20} />
		</IconButton>
	</div>
</div>

<TitleSearchModal bind:visible={isSearchVisible} />
