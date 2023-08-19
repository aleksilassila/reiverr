<script lang="ts">
	import { addMessages, init, locale } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.store';
	import { SUPPORTED_LANGUAGES } from '$lib/utils/supported-languages';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';

	addMessages('en', en);
	addMessages('es', es);

	$: {
		if ($settings.language) {
			const selectedLocale = SUPPORTED_LANGUAGES[parseInt($settings.language)];
			locale.set(selectedLocale);
		} else {
			locale.set('en');
		}
	}

	init({
		initialLocale: SUPPORTED_LANGUAGES[parseInt($settings.language)],
		fallbackLocale: 'en'
	});
</script>
