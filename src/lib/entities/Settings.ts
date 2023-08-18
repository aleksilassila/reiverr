import type { SettingsValues } from '$lib/stores/settings.store';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'settings' })
export class Settings extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	@Column('boolean', { default: false })
	isSetupDone: boolean;

	// General

	@Column('boolean', { default: true })
	autoplayTrailers: boolean;

	@Column('boolean', { default: true })
	excludeLibraryItemsFromDiscovery: boolean;

	@Column('text', { default: 'en' })
	language: string;

	@Column('text', { default: 'US' })
	region: string;
	@Column('integer', { default: 150 })
	animationDuration: number;

	// Discover
	// @Column()
	// discoverIncludedLanguages: string[];

	@Column('boolean', { default: true })
	discoverFilterBasedOnLanguage: boolean;

	// Sonarr

	@Column('text', { nullable: true, default: null })
	sonarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: null })
	sonarrApiKey: string | null;

	@Column('integer', { default: 0 })
	sonarrQualityProfileId: number;

	@Column('integer', { default: 0 })
	sonarrLanguageProfileId: number;

	@Column('text', { default: '/tv' })
	sonarrRootFolderPath: string;

	// Radarr

	@Column('text', { nullable: true, default: null })
	radarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: null })
	radarrApiKey: string | null;

	@Column('integer', { default: 0 })
	radarrQualityProfileId: number;

	@Column('integer', { default: 0 })
	radarrProfileId: number;

	@Column('text', { default: '/movies' })
	radarrRootFolderPath: string;

	// Jellyfin

	@Column('text', { nullable: true, default: null })
	jellyfinBaseUrl: string | null;

	@Column('text', { nullable: true, default: null })
	jellyfinApiKey: string | null;

	@Column('text', { nullable: true, default: null })
	jellyfinUserId: string | null;

	// Playback

	@Column('text', { default: 'reiverr' })
	preferredPlaybackSource: 'reiverr' | 'jellyfin';

	public static async get(name = 'default'): Promise<Settings> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new Settings();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return defaultSettings;
		}

		return settings;
	}

	public static async set(name: string, values: SettingsValues): Promise<Settings | null> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return null;

		settings.autoplayTrailers = values.autoplayTrailers;

		settings.radarrApiKey = values.radarr.apiKey;
		settings.radarrBaseUrl = values.radarr.baseUrl;

		settings.sonarrApiKey = values.sonarr.apiKey;
		settings.sonarrBaseUrl = values.sonarr.baseUrl;

		settings.jellyfinApiKey = values.jellyfin.apiKey;
		settings.jellyfinBaseUrl = values.jellyfin.baseUrl;
		settings.jellyfinUserId = values.jellyfin.userId;
		await settings.save();

		return settings;
	}
}
