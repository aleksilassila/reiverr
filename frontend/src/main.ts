// import { generateApi } from 'swagger-typescript-api';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// if (import.meta.env.MODE === 'development') {
// 	console.log('Generating API');
// 	generateApi({
// 		name: 'reiverr.openapi.ts',
// 		url: 'https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json',
// 		output:
// 			require.main.path
// 		// generateClient: true,
// 		// generateRouteTypes: false,
// 		// sortTypes: true,
// 		httpClientType: 'axios'
// 	});
// }

const app = mount(App, { target: document.getElementById('app')! });

export default app;
