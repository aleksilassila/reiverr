<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import {
		globalBackground,
		topBackground,
		unfocusGlobalBackground
	} from '$lib/components/GlobalBackground/background-stack.store';
	import { PLATFORM_WEB } from '$lib/constants';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { userActivity } from '$lib/stores/user-activity.store';
	import classNames from 'classnames';
	import { Cross1 } from 'radix-icons-svelte';
	import { type Readable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import FloatingIconButton from '../FloatingIconButton.svelte';
	import BackgroundBackdrop from './BackgroundBackdrop.svelte';
	import BackgroundCarousel from './BackgroundCarousel.svelte';

	let hasFocus: Readable<boolean>;

	let autoplayVideo = false;
	let loadDelayTimeout: ReturnType<typeof setTimeout> | undefined;

	$: {
		if ($topBackground.video) {
			autoplayVideo = false;
			clearTimeout(loadDelayTimeout);

			loadDelayTimeout = setTimeout(() => {
				autoplayVideo = true;
			}, 2000);
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:wheel={() => unfocusGlobalBackground()} on:click={() => unfocusGlobalBackground()}>
	<div class="absolute inset-0 bg-secondary-900" />

	{#each $topBackground.backgrounds as { backdropUri: backdropUrl, visible }, index (backdropUrl)}
		{#key backdropUrl}
			<BackgroundBackdrop backdropUri={backdropUrl} {visible} hasFocus={$hasFocus} />
		{/key}
	{/each}

	<Container class="contents">
		<Container
			bind:hasFocusWithin={hasFocus}
			class="contents"
			on:navigate={({ detail }) => {
				console.log(detail);
				if (detail.direction === 'down' && detail.willLeaveContainer) {
					unfocusGlobalBackground();
					detail.preventNavigation();
					detail.stopPropagation();
				}
			}}
			on:mount={globalBackground.registrar}
		>
			{#if $topBackground.video}
				{@const video = $topBackground.video}
				{#key video.id}
					<div out:fade={{ duration: 200 }}>
						<Container
							class={classNames('absolute inset-0 transition-opacity duration-500', {
								'pointer-events-none': !$hasFocus
							})}
							on:click={({ detail: e }) => e.stopPropagation()}
							on:back={() => topBackground.destroyVideo()}
						>
							{#if $topBackground.video}
								<svelte:component
									this={video.component}
									{...video.props}
									paused={!$hasFocus && !$localSettings.autoplayTrailers}
									muted={!$hasFocus}
									load={$localSettings.autoplayTrailers ? $hasFocus || autoplayVideo : true}
								/>
							{/if}
						</Container>
					</div>
				{/key}
			{:else}
				<Container
					on:back={() => unfocusGlobalBackground()}
					on:wheel={(e) => e.stopPropagation()}
					on:click={({ detail: e }) => e.stopPropagation()}
					on:navigate={({ detail }) => {
						if (detail.direction === 'left') {
							topBackground.previousBackground();
							detail.preventNavigation();
							detail.stopPropagation();
						} else if (detail.direction === 'right') {
							topBackground.nextBackground();
							detail.preventNavigation();
							detail.stopPropagation();
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
						on:jumpTo={({ detail: index }) => {
							topBackground.setIndex(index);
						}}
					/>
				</Container>
				{#if PLATFORM_WEB}
					<FloatingIconButton
						class={classNames('absolute top-12 right-16 transition-opacity', {
							'opacity-0': !$hasFocus || $userActivity
						})}
						on:click={() => unfocusGlobalBackground()}
					>
						<Cross1 size={32} />
					</FloatingIconButton>
				{/if}
			{/if}
		</Container>
		<!-- For willLeaveContainer -->
		<Container />
	</Container>

	<div
		class="transition-opacity duration-300"
		class:opacity-0={$hasFocus}
		class:pointer-events-none={$hasFocus}
		on:click={(e) => e.stopPropagation()}
	>
		<slot />
	</div>
</div>
