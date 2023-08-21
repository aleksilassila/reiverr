<script lang="ts">
	import { addMessages, init, locale, dictionary } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.store';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';

	addMessages('en', en);
	addMessages('es', es);

	settings.subscribe((value) => {
		if (value.language) {
			locale.set(value.language);
		} else {
			locale.set('en');
		}
	});

	init({
		initialLocale: $settings.language,
		fallbackLocale: 'en'
	});
</script>
