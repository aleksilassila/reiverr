<script lang="ts">
	import FormButton from '$lib/components/forms/FormButton.svelte';
	import { onDestroy, type ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';

	export let handleHealthCheck: () => Promise<boolean>;

	let type: ComponentProps<FormButton>['type'] = 'base';
	let loading = false;

	let healthTimeout: NodeJS.Timeout;
	$: {
		if (type !== 'base') {
			clearTimeout(healthTimeout);
			healthTimeout = setTimeout(() => {
				type = 'base';
			}, 2000);
		}
	}

	function handleClick() {
		loading = true;
		handleHealthCheck().then((ok) => {
			if (ok) {
				type = 'success';
			} else {
				type = 'error';
			}
			loading = false;
		});
	}

	onDestroy(() => {
		clearTimeout(healthTimeout);
	});
</script>

<FormButton {type} {loading} on:click={handleClick}
	>{$_('settings.integrations.testConnection')}</FormButton
>
