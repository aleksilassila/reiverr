<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { handleKeyboardNavigation } from './lib/selectable';
	import ModalStack from './lib/components/Modal/ModalStack.svelte';
	import NavigationDebugger from './lib/components/DebugElements.svelte';
	import StackRouter from './lib/components/StackRouter/StackRouter.svelte';
	import { stackRouter } from './lib/components/StackRouter/StackRouter';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import NotificationStack from './lib/components/Notifications/NotificationStack.svelte';
	import { createModal } from './lib/components/Modal/modal.store';
	import UpdateDialog from './lib/components/Dialog/UpdateDialog.svelte';
	import { localSettings } from './lib/stores/localstorage.store';
	import { isAppInitialized, user } from './lib/stores/user.store';
	import { sessions } from './lib/stores/session.store';
	import SplashScreen from './lib/pages/SplashScreen.svelte';
	import UsersPage from './lib/pages/UsersPage.svelte';
	import { createErrorNotification } from './lib/components/Notifications/notification.store';
	import OnboardingDialog from '$lib/components/OnboardingDialog/OnboardingDialog.svelte';

	user.subscribe((s) => {
		console.log('user', s);
		if (s?.onboardingDone === false) {
			console.log('ONBOARDING');
			createModal(OnboardingDialog, {});
		}
	});
	sessions.subscribe((s) => console.log('sessions', s));

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

	async function fetchLatestVersion() {
		return axios
			.get('https://api.github.com/repos/aleksilassila/reiverr/releases')
			.then(
				(res) => res.data?.find((v: { tag_name: string }) => v.tag_name.startsWith('v2'))?.tag_name
			);
	}

	function handleError(event: any) {
		createErrorNotification(event?.error?.message ?? 'An error occurred');
	}

	onMount(() => {
		if ($localSettings.checkForUpdates)
			fetchLatestVersion().then((latestVersion) => {
				// @ts-ignore
				if (
					latestVersion !== `v${REIVERR_VERSION}` &&
					latestVersion !== $localSettings.skippedVersion
				) {
					createModal(UpdateDialog, { version: latestVersion });
				}
			});
	});
</script>

<I18n />
<!--<Container class="w-full h-full overflow-auto text-white scrollbar-hide">-->
{#if !$isAppInitialized || $user === undefined}
	<SplashScreen />
{:else if $user === null}
	<UsersPage />
{:else}
	<!--		<Router primary={false}>-->
	<!--		<Container class="flex flex-col relative" direction="horizontal" trapFocus>-->
	<!--				<Route path="series/*">-->
	<!--					<SeriesHomePage />-->
	<!--				</Route>-->
	<!--				<Route path="movies/*">-->
	<!--					<MoviesHomePage />-->
	<!--				</Route>-->
	<!--				<Route path="library/*">-->
	<!--					<LibraryPage />-->
	<!--				</Route>-->
	<!--				<Route path="manage">-->
	<!--					<ManagePage />-->
	<!--				</Route>-->
	<!--				<Route path="search">-->
	<!--					<SearchPage />-->
	<!--				</Route>-->
	<!--				<Route path="*">-->
	<!--					<PageNotFound />-->
	<!--				</Route>-->
	<StackRouter stack={stackRouter} />
	<!--		</Container>-->
	<!--		</Router>-->
{/if}

<ModalStack />

<NotificationStack />

{#if import.meta.env.DEV}
	<NavigationDebugger />
{/if}
<!-- <svelte:window
	on:keydown={handleKeyboardNavigation}
	on:error={handleError}
	on:unhandledrejection={handleError}
/> -->

<svelte:window on:keydown={handleKeyboardNavigation} on:error={handleError} />
