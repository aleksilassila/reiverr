<script lang="ts">
	import { settings } from '$lib/stores/settings.store';
	import { addMessages, init, locale } from 'svelte-i18n';

	import de from '../../lang/de.json';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';
	import fr from '../../lang/fr.json';
	import it from '../../lang/it.json';

	addMessages('de', de);
	addMessages('en', en);
	addMessages('es', es);
	addMessages('fr', fr);
	addMessages('it', it);

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
