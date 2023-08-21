<script lang="ts">
	import { Cross1, HamburgerMenu, MagnifyingGlass, Person } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { page } from '$app/stores';
	import TitleSearchModal from './TitleSearchModal.svelte';
	import IconButton from '../IconButton.svelte';
	import { fade } from 'svelte/transition';
	import { modalStack } from '../../stores/modal.store';
	import { _ } from 'svelte-i18n';

	let y = 0;
	let transparent = true;
	let baseStyle = '';

	let isMobileMenuVisible = false;

	function getLinkStyle(path: string) {
		return classNames('selectable rounded-sm px-2 -mx-2 sm:text-base text-xl', {
			'text-amber-200': $page.url.pathname === path,
			'hover:text-zinc-50 cursor-pointer': $page.url.pathname !== path
		});
	}

	function openSearchModal() {
		modalStack.create(TitleSearchModal, {});
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			openSearchModal();
		}
	}

	$: {
		transparent = y <= 0;
		baseStyle = classNames(
			'fixed px-8 inset-x-0 grid-cols-[min-content_1fr_min-content] items-center z-10',
			'transition-all',
			{
				'bg-stone-900 bg-opacity-50 backdrop-blur-2xl': !isMobileMenuVisible && !transparent,
				'h-16': !transparent,
				'h-16 sm:h-24': transparent
			}
		);
	}
</script>

<svelte:window bind:scrollY={y} on:keydown={handleShortcuts} />

<div class={classNames(baseStyle, 'hidden sm:grid')}>
	<a
		href="/"
		class="hidden sm:flex gap-2 items-center hover:text-inherit selectable rounded-sm px-2 -mx-2"
	>
		<div class="rounded-full bg-amber-300 h-4 w-4" />
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</a>
	<div
		class="flex items-center justify-center gap-4 md:gap-8 font-normal text-sm tracking-wider text-zinc-200"
	>
		<a href="/" class={$page && getLinkStyle('/')}>
			{$_('navbar.home')}
		</a>
		<a href="/discover" class={$page && getLinkStyle('/discover')}>
			{$_('navbar.discover')}
		</a>
		<a href="/library" class={$page && getLinkStyle('/library')}>
			{$_('navbar.library')}
		</a>
		<a href="/sources" class={$page && getLinkStyle('/sources')}>
			{$_('navbar.sources')}
		</a>
		<a href="/settings" class={$page && getLinkStyle('/settings')}>
			{$_('navbar.settings')}
		</a>
	</div>
	<div class="flex gap-2 items-center">
		<IconButton on:click={openSearchModal}>
			<MagnifyingGlass size={20} />
		</IconButton>
		<IconButton>
			<Person size={20} />
		</IconButton>
	</div>
</div>

<div class={classNames(baseStyle, ' grid sm:hidden')}>
	<a href="/" class="flex gap-2 items-center hover:text-inherit selectable rounded-sm px-2 -mx-2">
		<div class="rounded-full bg-amber-300 h-4 w-4" />
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</a>
	<div />
	<div class="flex items-center gap-2">
		<IconButton on:click={openSearchModal}>
			<MagnifyingGlass size={20} />
		</IconButton>

		{#if isMobileMenuVisible}
			<IconButton on:click={() => (isMobileMenuVisible = false)}>
				<Cross1 size={20} />
			</IconButton>
		{:else}
			<IconButton on:click={() => (isMobileMenuVisible = true)}>
				<HamburgerMenu size={20} />
			</IconButton>
		{/if}
	</div>
</div>

{#if isMobileMenuVisible}
	<div
		class="fixed inset-0 pt-16 bottom-0 bg-stone-900 bg-opacity-50 backdrop-blur-2xl z-[9] grid grid-rows-3 transition-all ease-linear"
		transition:fade={{ duration: 150 }}
	>
		<div class="row-span-2 flex flex-col gap-4 items-center justify-center">
			<a on:click={() => (isMobileMenuVisible = false)} href="/" class={$page && getLinkStyle('/')}>
				{$_('navbar.home')}
			</a>
			<a
				on:click={() => (isMobileMenuVisible = false)}
				href="/discover"
				class={$page && getLinkStyle('/discover')}
			>
				{$_('navbar.discover')}
			</a>
			<a
				on:click={() => (isMobileMenuVisible = false)}
				href="/library"
				class={$page && getLinkStyle('/library')}
			>
				{$_('navbar.library')}
			</a>
			<a
				on:click={() => (isMobileMenuVisible = false)}
				href="/sources"
				class={$page && getLinkStyle('/sources')}
			>
				{$_('navbar.sources')}
			</a>
			<a
				on:click={() => (isMobileMenuVisible = false)}
				href="/settings"
				class={$page && getLinkStyle('/settings')}
			>
				{$_('navbar.settings')}
			</a>
		</div>
	</div>
{/if}
