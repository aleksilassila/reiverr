<script lang="ts">
	import { useLocation, useNavigate } from 'svelte-navigator';
	import Container from '../../Container.svelte';

	const location = useLocation();
	const navigate = useNavigate();

	location.subscribe((l) => {
		if (l.pathname === '/dist/index.html') {
			navigate('/');
		}
	});
</script>

<Container class="pl-24 flex flex-col items-start" focusOnMount>
	<div>404 {$location.pathname}</div>
</Container>
