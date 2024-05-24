<script lang="ts">
	import I18n from './lib/components/Lang/I18n.svelte';
	import { appState } from './lib/stores/app-state.store';
	import { handleKeyboardNavigation } from './lib/selectable';
	import Container from './Container.svelte';
	import LoginPage from './lib/pages/LoginPage.svelte';
	import ModalStack from './lib/components/Modal/ModalStack.svelte';
	import NavigationDebugger from './lib/components/DebugElements.svelte';
	import StackRouter from './lib/components/StackRouter/StackRouter.svelte';
	import { defaultStackRouter } from './lib/components/StackRouter/StackRouter';
	import Sidebar from './lib/components/Sidebar/Sidebar.svelte';
	import OnboardingPage from './lib/pages/OnboardingPage.svelte';

	appState.subscribe((s) => console.log('appState', s));

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
</script>

<I18n />
<Container class="w-full h-full overflow-auto text-white scrollbar-hide">
	{#if $appState.user === undefined}
		<div class="h-full w-full flex flex-col items-center justify-center">
			<div class="flex items-center justify-center hover:text-inherit selectable rounded-sm mb-2">
				<div class="rounded-full bg-amber-300 h-4 w-4 mr-2" />
				<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
			</div>
			<div>Loading...</div>
		</div>
	{:else if $appState.user === null}
		<LoginPage />
	{:else if $appState.user.onboardingDone === false}
		<OnboardingPage />
	{:else}
		<!--		<Router primary={false}>-->
		<Container class="flex flex-col relative" direction="horizontal" trapFocus>
			<Sidebar />
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
			<StackRouter stack={defaultStackRouter} />
		</Container>
		<!--		</Router>-->

		<ModalStack />
	{/if}
</Container>

<NavigationDebugger />

<svelte:window on:keydown={handleKeyboardNavigation} />
