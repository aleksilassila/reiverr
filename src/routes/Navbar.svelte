<script>
	import { MagnifyingGlass, Person } from 'radix-icons-svelte';
	import classNames from 'classnames';

	let y = 0;
	let transparent = true;
	let baseStyle = '';

	$: {
		transparent = y === 0;
		baseStyle = classNames(
			'fixed px-8 inset-x-0 grid grid-cols-[min-content_1fr_min-content] items-center z-10',
			'transition-all',
			{
				'bg-zinc-900 bg-opacity-50 backdrop-blur-2xl h-16': !transparent,
				'h-24': transparent
			}
		);
	}
</script>

<svelte:window bind:scrollY={y} />

<div class={baseStyle}>
	<div class="flex gap-2 items-center">
		<div class="rounded-full bg-amber-300 h-4 w-4" />
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</div>
	<div
		class="flex items-center justify-center gap-8 font-normal text-sm tracking-wider text-zinc-200"
	>
		<div class="cursor-pointer text-amber-200">Home</div>
		<div class="hover:text-zinc-50 cursor-pointer">Discover</div>
		<div class="hover:text-zinc-50 cursor-pointer">Library</div>
		<div class="hover:text-zinc-50 cursor-pointer">Sources</div>
		<div class="hover:text-zinc-50 cursor-pointer">Settings</div>
	</div>
	<div class="flex gap-2">
		<div class="p-2 cursor-pointer text-zinc-200 hover:text-zinc-50">
			<MagnifyingGlass size="20" />
		</div>
		<div class="p-2 cursor-pointer text-zinc-200 hover:text-zinc-50">
			<Person size="20" />
		</div>
	</div>
</div>
