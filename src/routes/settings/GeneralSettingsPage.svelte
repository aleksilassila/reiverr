<script lang="ts">
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import type { SettingsValues } from '$lib/stores/settings.store';
	import { ISO_LANGUAGES } from '$lib/utils/iso-languages';
	import { ISO_REGIONS } from '$lib/utils/iso-regions';

	export let values: SettingsValues;
</script>

<div
	class="grid grid-cols-[1fr_min-content] justify-items-start place-items-center gap-4 text-zinc-400"
>
	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		User Interface
	</h1>
	<h2>Language</h2>
	<Select bind:value={values.language}>
		{#each Object.entries(ISO_LANGUAGES) as [code, lang]}
			<option value={code}>{lang.name}</option>
		{/each}
	</Select>
	<h2>Autoplay Trailers</h2>
	<Toggle bind:checked={values.autoplayTrailers} />

	<h2>Animation Duration</h2>
	<Input type="number" bind:value={values.animationDuration} />

	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		Discovery
	</h1>
	<h2>Region</h2>
	<Select bind:value={values.discover.region}>
		<option value="">None</option>
		{#each Object.entries(ISO_REGIONS) as [code, region]}
			<option value={code}>{region}</option>
		{/each}
	</Select>
	<h2>Exclude library items from Discovery</h2>
	<Toggle bind:checked={values.discover.excludeLibraryItems} />

	<div>
		<h2>Included languages</h2>
		<p class="text-sm text-zinc-500 mt-1">
			Filter results based on spoken language. Takes ISO 639-1 language codes separated with commas.
			Leave empty to disable.
		</p>
	</div>
	<Input bind:value={values.discover.includedLanguages} placeholder={'en,fr,de'} />
</div>
