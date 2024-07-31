import './app.css';
import App from './App.svelte';

const app = new App({
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	target: document.getElementById('app')
});

export default app;
