<script lang="ts">
	import Container from '../../../Container.svelte';
	import { _ } from 'svelte-i18n';
</script>

<Container
	class="px-6 py-2 rounded-lg font-medium tracking-wide flex items-center bg-stone-600/50 animate-pulse"
>
	<div class="opacity-0">
		<slot>{$_('navbar.loading')}</slot>
	</div>
</Container>
