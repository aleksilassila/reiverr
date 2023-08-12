<!-- I18n.svelte -->

<script>
	import { addMessages, init } from 'svelte-i18n';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';

	addMessages('en', en);
	addMessages('es', es);

	init({
		initialLocale: 'en',
		fallbackLocale: 'en'
	});
</script>
