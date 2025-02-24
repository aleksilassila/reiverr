<script lang="ts">
	import { navigate } from '../StackRouter/StackRouter';

	export let to: Required<{ to: string }>['to'] = '#';
</script>

<a href={to} on:click|preventDefault={() => navigate(to)} class="flex-1">
	<slot />
</a>
