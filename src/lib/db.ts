import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Settings } from './entities/Settings';
import { dev } from '$app/environment';

class TypeOrm {
	private static instance: Promise<DataSource | null> | null = null;

	private constructor() {
		// Private constructor to prevent external instantiation
	}

	public static getDb(): Promise<DataSource | null> {
		if (!TypeOrm.instance) {
			TypeOrm.instance = new DataSource({
				type: 'sqlite',
				database: 'config/reiverr.sqlite',
				synchronize: true,
				entities: [Settings],
				logging: true
			})
				.initialize()
				.then((fulfilled) => {
					console.info('Data Source has been initialized!');
					return fulfilled;
				})
				.catch((err) => {
					console.error('Error during Data Source initialization', err);
					return null;
				});
		}
		return TypeOrm.instance;
	}
}

export default TypeOrm;
