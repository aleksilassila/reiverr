process.env.PORT = '9494';
const { app, BrowserWindow } = require('electron');

(async () => {
	await import('../build/index.js');
	// const serveURL = serve({ directory: '.' });
	const port = process.env.PORT || 5173;
	let mainWindow;

	const createWindow = () => {
		if (!mainWindow) {
			mainWindow = new BrowserWindow({
				width: 1200,
				height: 800,
				webPreferences: {
					nodeIntegration: true
				}
			});
		}

		mainWindow.once('close', () => {
			mainWindow = null;
		});

		loadSite(port);

		return mainWindow;
	};

	function loadSite(port) {
		mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
			console.log('Error loading URL, retrying', e);
			setTimeout(() => {
				loadSite(port);
			}, 500);
		});
	}

	app.whenReady().then(() => {
		createWindow();
		app.on('activate', () => {
			if (!mainWindow) {
				createWindow();
			}
		});
	});

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') app.quit();
	});
})();
