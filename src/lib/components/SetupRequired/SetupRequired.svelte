<script lang="ts">
	export let missingEnvironmentVariables: Record<string, boolean>;
</script>

<div class="min-h-screen flex flex-col max-w-screen-2xl mx-auto p-4 md:p-8 lg:px-32 gap-2">
	<h1 class="font-bold text-3xl">Welcome to Reiverr</h1>
	<p>
		It seems like the application is missing some environment variables that are necessary for the
		application to function. Please provide the following environment variables:
	</p>
	<ul class="flex flex-col gap-1">
		{#each Object.keys(missingEnvironmentVariables).filter((k) => missingEnvironmentVariables[k]) as variableName}
			<code class="bg-lighten p-0.5 px-2 rounded self-start">{variableName}</code>
		{/each}
	</ul>
</div>
