<script lang="ts">
	import { settings } from '$lib/stores/settings.store';
	import { addMessages, init, locale } from 'svelte-i18n';

	import de from '../../lang/de.json';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';
	import fr from '../../lang/fr.json';
	import it from '../../lang/it.json';
	import nl from '../../lang/nl.json';
	import pt_pt from '../../lang/pt-PT.json';
	import pt_br from '../../lang/pt-BR.json';

	addMessages('de', de);
	addMessages('en', en);
	addMessages('es', es);
	addMessages('fr', fr);
	addMessages('it', it);
	addMessages('nl', nl);
	addMessages('pt', pt_pt);
	// addMessages('pt-BR', pt_br); // No support for pt-BR vs pt-PT in svelte-i18n yet :(

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
