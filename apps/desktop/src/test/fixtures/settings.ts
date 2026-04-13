export interface MockSettings {
	id: string
	antiBanEnabled: boolean
	theme: "light" | "dark" | "system"
	notificationsEnabled: boolean
	autoStart?: boolean
	minimizeToTray?: boolean
	checkUpdates?: boolean
	aiConfig?: {
		provider: string
		apiKey: string
		model: string
	}
}

interface CreateSettingsFixtureOptions {
	id?: string
	antiBanEnabled?: boolean
	theme?: "light" | "dark" | "system"
	notificationsEnabled?: boolean
	autoStart?: boolean
	minimizeToTray?: boolean
	checkUpdates?: boolean
	aiConfig?: {
		provider: string
		apiKey: string
		model: string
	}
}

export function createSettingsFixture(options: CreateSettingsFixtureOptions = {}): MockSettings {
	return {
		id: options.id ?? "settings_001",
		antiBanEnabled: options.antiBanEnabled ?? true,
		theme: options.theme ?? "dark",
		notificationsEnabled: options.notificationsEnabled ?? true,
		autoStart: options.autoStart ?? false,
		minimizeToTray: options.minimizeToTray ?? true,
		checkUpdates: options.checkUpdates ?? true,
		aiConfig: options.aiConfig ?? {
			provider: "nim",
			apiKey: "test-api-key",
			model: "meta/llama-3.1-8b-instruct",
		},
	}
}

export const mockDefaultSettings = createSettingsFixture()

export const mockDarkThemeSettings = createSettingsFixture({
	theme: "dark",
})

export const mockLightThemeSettings = createSettingsFixture({
	theme: "light",
})

export const mockSystemThemeSettings = createSettingsFixture({
	theme: "system",
})

export const mockAntiBanDisabledSettings = createSettingsFixture({
	antiBanEnabled: false,
})

export const mockNoNotificationsSettings = createSettingsFixture({
	notificationsEnabled: false,
})

export const mockOpenAISettings = createSettingsFixture({
	aiConfig: {
		provider: "openai",
		apiKey: "sk-test-key",
		model: "gpt-4",
	},
})

export const mockAnthropicSettings = createSettingsFixture({
	aiConfig: {
		provider: "anthropic",
		apiKey: "sk-ant-test-key",
		model: "claude-3-opus",
	},
})
