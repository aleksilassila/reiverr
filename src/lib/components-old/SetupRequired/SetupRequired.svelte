<script lang="ts">
	export let missingEnvironmentVariables: Record<string, boolean>;
	import { _ } from 'svelte-i18n';
</script>

<div class="min-h-screen flex flex-col max-w-screen-2xl mx-auto p-4 md:p-8 lg:px-32 gap-2">
	<h1 class="font-bold text-3xl">{`${$_('setupRequiredTitle')} ${$_('appName')}`}</h1>
	<p>
		{$_('setupRequiredDescription')}
	</p>
	<ul class="flex flex-col gap-1">
		{#each Object.keys(missingEnvironmentVariables).filter((k) => missingEnvironmentVariables[k]) as variableName}
			<code class="bg-lighten p-0.5 px-2 rounded self-start">{variableName}</code>
		{/each}
	</ul>
</div>
