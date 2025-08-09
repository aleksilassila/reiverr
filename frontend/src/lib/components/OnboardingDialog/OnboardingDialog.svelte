<script lang="ts">
	import { ArrowRight, Cross1 } from 'radix-icons-svelte';
	import Button from '../Button.svelte';
	import Container from '../Container.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { navigate } from '../StackRouter/StackRouter';
	import { user } from '$lib/stores/user.store';

	export let modalId: symbol;

	async function finalizeSetup() {
		await user.updateUser((prev) => ({
			...prev,
			onboardingDone: true
		}));
	}
</script>

<Dialog let:close size="lg" on:close={() => finalizeSetup()}>
	<h1 class="h2 mb-4">Welcome to Reiverr</h1>
	<div class="body mb-8">
		Looks like this is a new account. To get most out of Reiverr, connect to TMDB for personalized
		recommendations and configure media sources to stream content.
	</div>
	<Container direction="horizontal" class="space-x-4">
		<Button
			type="primary-dark"
			iconAfter={ArrowRight}
			on:click={() => {
				navigate('/manage');
				close();
			}}
		>
			Go to settings
		</Button>
		<Button type="primary-dark" on:clickOrSelect={() => close()}>Dismiss</Button>
	</Container>
</Dialog>
