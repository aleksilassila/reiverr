<script lang="ts">
	import GlobalBackgroundStack from '$lib/components/GlobalBackground/BackgroundStack.svelte';
	import OnboardingDialog from '$lib/components/OnboardingDialog/OnboardingDialog.svelte';
	import { stackRouter } from '$lib/components/StackRouter/stack-router.store';
	import { connectEvents } from '$lib/queries/events';
	import { queryClient } from '$lib/queries/query-client';
	import { inputMode } from '$lib/stores/input-mode.store';
	import { userActivity } from '$lib/stores/user-activity.store';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import NavigationDebugger from './lib/components/DebugElements.svelte';
	import I18n from './lib/components/Lang/I18n.svelte';
	import { createModal } from './lib/components/Modal/modal.store';
	import { createErrorNotification } from './lib/components/Notifications/notification.store';
	import NotificationStack from './lib/components/Notifications/NotificationStack.svelte';
	import StackRouter from './lib/components/StackRouter/StackRouter.svelte';
	import UpdateChecker from './lib/components/UpdateChecker.svelte';
	import SplashScreen from './lib/pages/SplashScreen.svelte';
	import UsersPage from './lib/pages/UsersPage.svelte';
	import {
		handleKeyboardNavigation,
		handleKeyboardNavigationKeyUp,
		setMouseMode
	} from './lib/selectable';
	import { sessions } from './lib/stores/session.store';
	import { isAppInitialized, user } from './lib/stores/user.store';

	user.subscribe((s) => {
		if (s?.onboardingDone === false) {
			createModal(OnboardingDialog, {});
		}
	});
	sessions.subscribe((s) => {
		connectEvents(s.activeSession);
	});

	// onMount(() => {
	// 	if (isTizen()) {
	// 		var myMediaKeyChangeListener = {
	// 			onpressed: function (key) {
	// 				console.log('Pressed key: ' + key);
	// 			},
	// 			onreleased: function (key) {
	// 				console.log('Released key: ' + key);
	// 			}
	// 		};
	//
	// 		tizen.mediakey.setMediaKeyEventListener(myMediaKeyChangeListener);
	// 	}
	// });

	function handleError(event: any) {
		createErrorNotification(event?.error?.message ?? 'An error occurred');
	}

	function handleKeyDown(e: KeyboardEvent) {
		handleKeyboardNavigation(e);
		inputMode.handleKeyDown(e);
		userActivity.registerUserActivity();
	}

	function handleMouseMove(e: MouseEvent) {
		inputMode.handleMouseMove(e);
		userActivity.registerUserActivity();
	}

	// Captured, so that a handler that stops the event (the dots of an episode card, a checkbox) cannot keep it
	function handleMouseInput() {
		setMouseMode(true);
	}
</script>

<I18n />

<!--<Container class="w-full h-full overflow-auto text-white scrollbar-hide">-->
<QueryClientProvider client={queryClient}>
	{#if !$isAppInitialized || $user === undefined}
		<SplashScreen />
	{:else}
		<GlobalBackgroundStack>
			{#if $user === null}
				<!-- Positioned like a routed page, so that it paints above the backdrop of the stack -->
				<div class="fixed inset-0">
					<UsersPage />
				</div>
			{:else}
				<StackRouter stack={stackRouter} />
			{/if}
		</GlobalBackgroundStack>
	{/if}
	<!-- {#if import.meta.env.DEV}
		<SvelteQueryDevtools buttonPosition="bottom-left" />
	{/if} -->
</QueryClientProvider>

<NotificationStack />
<UpdateChecker />

{#if import.meta.env.DEV}
	<NavigationDebugger />
{/if}
<!-- <svelte:window
	on:keydown={handleKeyboardNavigation}
	on:error={handleError}
	on:unhandledrejection={handleError}
/> -->

<svelte:window
	on:mousemove={handleMouseMove}
	on:mousedown|capture={handleMouseInput}
	on:wheel|capture|passive={handleMouseInput}
	on:keydown={handleKeyDown}
	on:keyup={handleKeyboardNavigationKeyUp}
	on:error={handleError}
/>
