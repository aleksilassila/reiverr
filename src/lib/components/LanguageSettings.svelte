<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SelectField from '../components/SelectField.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import SelectItem from '../components/SelectItem.svelte';
	import { localSettings } from '../stores/localstorage.store';
  

	const dispatch = createEventDispatcher();
  
	const AVAILABLE_LANGUAGES = {
		en: { name: "English", nativeName: "English" },
		fr: { name: "French", nativeName: "Français" },
		de: { name: "German", nativeName: "Deutsch" },
		it: { name: "Italian", nativeName: "Italiano" },
		es: { name: "Spanish", nativeName: "Español" }
	};
  
	let selectedLanguage: keyof typeof AVAILABLE_LANGUAGES = 'en';
	let showLanguageDialog = false;
  
	localSettings.subscribe(value => {
	  selectedLanguage = (value.language && value.language in AVAILABLE_LANGUAGES ? value.language : 'en') as keyof typeof AVAILABLE_LANGUAGES;
	});
  
	function openLanguageDialog() {
	  showLanguageDialog = true;
	}
  
	function handleSelectLanguage(language: string) {
	  if (language in AVAILABLE_LANGUAGES) {
		localSettings.update(settings => ({ ...settings, language }));
		selectedLanguage = language as keyof typeof AVAILABLE_LANGUAGES;
		showLanguageDialog = false;
		dispatch('change', { language: selectedLanguage });
	  }
	}
  </script>
  
  <SelectField
	value={AVAILABLE_LANGUAGES[selectedLanguage]?.name || 'Select Language'}
	on:clickOrSelect={openLanguageDialog}
	tabindex="0"
  />
  
  {#if showLanguageDialog}
	<Dialog on:close={() => (showLanguageDialog = false)}>
	  {#each Object.entries(AVAILABLE_LANGUAGES) as [code, language]}
		<SelectItem 
		  selected={code === selectedLanguage} 
		  on:clickOrSelect={() => handleSelectLanguage(code)}		>
		  {language.name}
		</SelectItem>
	  {/each}
	</Dialog>
  {/if}
  