<script lang="ts">
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import type { SettingsValues } from '$lib/stores/settings.store';
	import { ISO_LANGUAGES } from '$lib/utils/iso-languages';
	import { ISO_REGIONS } from '$lib/utils/iso-regions';
	import { _, dictionary } from 'svelte-i18n';

	export let values: SettingsValues;
</script>

<div
	class="grid grid-cols-[1fr_min-content] justify-items-start place-items-center gap-4 text-zinc-400"
>
	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		{$_('settings.general.userInterface.userInterface')}
	</h1>
	<h2>{$_('settings.general.userInterface.language')}</h2>
	<Select bind:value={values.language}>
		{#each Object.entries(ISO_LANGUAGES).filter( ([c, l]) => Object.keys($dictionary).includes(c) ) as [code, lang]}
			<option value={code}>{`${lang?.name} - ${lang?.nativeName}`}</option>
		{/each}
	</Select>
	<h2>
		{$_('settings.general.userInterface.autoplayTrailers')}
	</h2>
	<Toggle bind:checked={values.autoplayTrailers} />

	<h2>
		{$_('settings.general.userInterface.animationDuration')}
	</h2>
	<Input type="number" bind:value={values.animationDuration} />

	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		{$_('settings.general.discovery.discovery')}
	</h1>
	<h2>
		{$_('settings.general.discovery.region')}
	</h2>
	<Select bind:value={values.discover.region}>
		<option value=""> {$_('settings.general.discovery.none')} </option>
		{#each Object.entries(ISO_REGIONS) as [code, region]}
			<option value={code}>{region}</option>
		{/each}
	</Select>
	<h2>{$_('settings.general.discovery.excludeLibraryItemsFromDiscovery')}</h2>
	<Toggle bind:checked={values.discover.excludeLibraryItems} />

	<div>
		<h2>
			{$_('settings.general.discovery.includedLanguages')}
		</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.general.discovery.includedLanguagesDescription')}
		</p>
	</div>
	<Input bind:value={values.discover.includedLanguages} placeholder={'en,fr,de'} />
</div>
