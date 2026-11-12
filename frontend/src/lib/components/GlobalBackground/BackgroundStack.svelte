<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Selectable } from '$lib/selectable';
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackgroundSelectable,
		topBackground,
		unfocusGlobalBackground
	} from '$lib/components/GlobalBackground/background-stack.store';
	import { PLATFORM_WEB } from '$lib/constants';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { userActivity } from '$lib/stores/user-activity.store';
	import classNames from 'classnames';
	import { Cross1 } from 'radix-icons-svelte';
	import { fade } from 'svelte/transition';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import BackgroundBackdrop from './BackgroundBackdrop.svelte';
	import BackgroundCarousel from './BackgroundCarousel.svelte';
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const selectable = new Selectable();
	const hasFocus = selectable.hasFocusWithin;

	onMount(() => {
		globalBackgroundSelectable.set(selectable);
		return () => globalBackgroundSelectable.set(undefined);
	});

	let autoplayVideo = $state(false);
	// Not state: the effect below clears and sets it, and would re-run on its own write
	let loadDelayTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if ($topBackground.video) {
			autoplayVideo = false;
			clearTimeout(loadDelayTimeout);

			loadDelayTimeout = setTimeout(() => {
				autoplayVideo = true;
			}, 2000);
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div onwheel={() => unfocusGlobalBackground()} onclick={() => unfocusGlobalBackground()}>
	<div class="absolute inset-0 bg-secondary-900"></div>

	{#each $topBackground.backgrounds as { backdropUri: backdropUrl, visible }, index (backdropUrl)}
		{#key backdropUrl}
			<BackgroundBackdrop backdropUri={backdropUrl} {visible} hasFocus={$hasFocus} />
		{/key}
	{/each}

	<Container class="contents">
		<Container
			{selectable}
			class="contents"
			onNavigate={(e) => {
				console.log(e);
				if (e.direction === 'down' && e.willLeaveContainer) {
					unfocusGlobalBackground();
					e.preventNavigation();
					e.stopPropagation();
				}
			}}
		>
			<!-- An each block over the one video, keyed by its id. Every change of the video makes a new
				block, so that a video that comes back while the previous one fades out is not given the
				block that is going away. And the item stays what it was after the video is gone: a block
				on the store's video would read the component and its props, when the component reads
				one, from a store that has no video any more -->
			{#each $topBackground.video ? [$topBackground.video] : [] as video (video.id)}
				<div out:fade|global={{ duration: 200 }}>
					<Container
						class={classNames('absolute inset-0 transition-opacity duration-500', {
							'pointer-events-none': !$hasFocus
						})}
						onclick={(e) => e.stopPropagation()}
						onBack={() => topBackground.destroyVideo()}
					>
						<video.component
							{...video.props}
							paused={!$hasFocus && !$localSettings.autoplayTrailers}
							muted={!$hasFocus}
							load={$localSettings.autoplayTrailers ? $hasFocus || autoplayVideo : true}
						/>
					</Container>
				</div>
			{:else}
				<Container
					onBack={() => unfocusGlobalBackground()}
					onwheel={(e) => e.stopPropagation()}
					onclick={(e) => e.stopPropagation()}
					onNavigate={(e) => {
						if (e.direction === 'left') {
							topBackground.previousBackground();
							e.preventNavigation();
							e.stopPropagation();
						} else if (e.direction === 'right') {
							topBackground.nextBackground();
							e.preventNavigation();
							e.stopPropagation();
						}
					}}
					class={classNames(
						'absolute inset-x-0 bottom-0 z-20 transition-opacity duration-500 flex flex-col justify-end bg-gradient-to-b from-transparent to-secondary-900',
						{
							'pointer-events-none': !$hasFocus,
							'opacity-0': !$hasFocus || $userActivity
						}
					)}
				>
					<BackgroundCarousel
						backgrounds={$topBackground.backgrounds}
						focusIndex={$topBackground.index}
						onJumpTo={(index) => {
							topBackground.setIndex(index);
						}}
					/>
				</Container>
				{#if PLATFORM_WEB}
					<FloatingIconButton
						class={classNames('absolute top-12 right-16 transition-opacity', {
							'opacity-0': !$hasFocus || $userActivity
						})}
						onclick={() => unfocusGlobalBackground()}
					>
						<Cross1 size={32} />
					</FloatingIconButton>
				{/if}
			{/each}
		</Container>
		<!-- For willLeaveContainer -->
		<Container />
	</Container>

	<div
		class="transition-opacity duration-300"
		class:opacity-0={$hasFocus}
		class:pointer-events-none={$hasFocus}
		onclick={(e) => e.stopPropagation()}
	>
		{@render children?.()}
	</div>
</div>
