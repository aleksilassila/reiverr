<script lang="ts">
	import { useLocation, useNavigate } from 'svelte-navigator';
	import Container from '$components/Container.svelte';
	import { navigate } from '../components/StackRouter/StackRouter';
	import { onMount } from 'svelte';

	onMount(() => {
		const l = window.location;
		if (l.pathname === '/dist/index.html') {
			navigate('/series');
		} else if (l.pathname === '/') {
			navigate('/series');
		}
	});
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	<div>404 {window.location.pathname}</div>
</Container>
