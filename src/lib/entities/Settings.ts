import { defaultSettings, type SettingsValues } from '$lib/stores/settings.store';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'settings' })
export class Settings extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	@Column('boolean', { default: false })
	isSetupDone: boolean;

	// General

	@Column('boolean', { default: defaultSettings.autoplayTrailers })
	autoplayTrailers: boolean;

	@Column('text', { default: defaultSettings.language })
	language: string;

	@Column('integer', { default: defaultSettings.animationDuration })
	animationDuration: number;

	// Discover
	@Column('text', { default: defaultSettings.discover.region })
	discoverRegion: string;

	@Column('boolean', { default: defaultSettings.discover.excludeLibraryItems })
	discoverExcludeLibraryItems: boolean;

	@Column('text', { default: defaultSettings.discover.includedLanguages })
	discoverIncludedLanguages: string;

	// Sonarr

	@Column('text', { nullable: true, default: defaultSettings.sonarr.baseUrl })
	sonarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultSettings.sonarr.apiKey })
	sonarrApiKey: string | null;

	@Column('text', { default: defaultSettings.sonarr.rootFolderPath })
	sonarrRootFolderPath: string;

	@Column('integer', { default: defaultSettings.sonarr.qualityProfileId })
	sonarrQualityProfileId: number;

	@Column('integer', { default: defaultSettings.sonarr.languageProfileId })
	sonarrLanguageProfileId: number;

	@Column('integer', { default: defaultSettings.sonarr.monitor })
	sonarrMonitor: number;

	@Column('boolean', { default: defaultSettings.sonarr.StartSearch })
	sonarrStartSearch: boolean;

	// Radarr

	@Column('text', { nullable: true, default: defaultSettings.radarr.baseUrl })
	radarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultSettings.radarr.apiKey })
	radarrApiKey: string | null;

	@Column('text', { default: defaultSettings.radarr.rootFolderPath })
	radarrRootFolderPath: string;

	@Column('integer', { default: defaultSettings.radarr.qualityProfileId })
	radarrQualityProfileId: number;

	@Column('integer', { default: defaultSettings.radarr.monitor })
	radarrMonitor: number;

	@Column('boolean', { default: defaultSettings.radarr.StartSearch })
	radarrStartSearch: boolean;

	// Jellyfin

	@Column('text', { nullable: true, default: defaultSettings.jellyfin.baseUrl })
	jellyfinBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultSettings.jellyfin.apiKey })
	jellyfinApiKey: string | null;

	@Column('text', { nullable: true, default: defaultSettings.jellyfin.userId })
	jellyfinUserId: string | null;

	public static async get(name = 'default'): Promise<SettingsValues> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new Settings();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return this.getSettingsValues(defaultSettings);
		}

		return this.getSettingsValues(settings);
	}

	static getSettingsValues(settings: Settings): SettingsValues {
		return {
			...defaultSettings,
			language: settings.language,
			autoplayTrailers: settings.autoplayTrailers,
			animationDuration: settings.animationDuration,

			discover: {
				...defaultSettings.discover,
				region: settings.discoverRegion,
				excludeLibraryItems: settings.discoverExcludeLibraryItems,
				includedLanguages: settings.discoverIncludedLanguages
			},

			sonarr: {
				...defaultSettings.sonarr,
				apiKey: settings.sonarrApiKey,
				baseUrl: settings.sonarrBaseUrl,
				monitor: settings.sonarrMonitor,
				StartSearch: settings.sonarrStartSearch,
				languageProfileId: settings.sonarrLanguageProfileId,
				qualityProfileId: settings.sonarrQualityProfileId,
				rootFolderPath: settings.sonarrRootFolderPath
			},
			radarr: {
				...defaultSettings.radarr,
				apiKey: settings.radarrApiKey,
				baseUrl: settings.radarrBaseUrl,
				monitor: settings.radarrMonitor,
				StartSearch: settings.radarrStartSearch,
				qualityProfileId: settings.radarrQualityProfileId,
				rootFolderPath: settings.radarrRootFolderPath
			},
			jellyfin: {
				...defaultSettings.jellyfin,
				apiKey: settings.jellyfinApiKey,
				baseUrl: settings.jellyfinBaseUrl,
				userId: settings.jellyfinUserId
			},
			initialised: true
		};
	}

	public static async set(name: string, values: SettingsValues): Promise<Settings | null> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return null;

		settings.language = values.language;
		settings.autoplayTrailers = values.autoplayTrailers;
		settings.animationDuration = values.animationDuration;

		settings.discoverRegion = values.discover.region;
		settings.discoverExcludeLibraryItems = values.discover.excludeLibraryItems;
		settings.discoverIncludedLanguages = values.discover.includedLanguages;

		settings.sonarrApiKey = values.sonarr.apiKey;
		settings.sonarrBaseUrl = values.sonarr.baseUrl;
		settings.sonarrLanguageProfileId = values.sonarr.languageProfileId;
		settings.sonarrQualityProfileId = values.sonarr.qualityProfileId;
		settings.sonarrRootFolderPath = values.sonarr.rootFolderPath;
		settings.sonarrMonitor = values.sonarr.monitor;
		settings.sonarrStartSearch = values.sonarr.StartSearch;

		settings.radarrApiKey = values.radarr.apiKey;
		settings.radarrBaseUrl = values.radarr.baseUrl;
		settings.radarrQualityProfileId = values.radarr.qualityProfileId;
		settings.radarrRootFolderPath = values.radarr.rootFolderPath;
		settings.radarrMonitor = values.radarr.monitor;
		settings.radarrStartSearch = values.radarr.StartSearch;

		settings.jellyfinApiKey = values.jellyfin.apiKey;
		settings.jellyfinBaseUrl = values.jellyfin.baseUrl;
		settings.jellyfinUserId = values.jellyfin.userId;

		await settings.save();

		return settings;
	}
}
