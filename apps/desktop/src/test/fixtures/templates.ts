import type { Template } from "@social-pip/types"

interface CreateTemplateFixtureOptions {
	id?: string
	name?: string
	sector?: string
	content?: string
	platforms?: string[]
	variants?: string[]
	createdAt?: Date
	updatedAt?: Date
}

export function createTemplateFixture(options: CreateTemplateFixtureOptions = {}): Template {
	return {
		id: options.id ?? "tpl_test001",
		name: options.name ?? "Test Template",
		sector: options.sector ?? "general",
		platforms: options.platforms ?? ["facebook"],
		content: options.content ?? "Hello {greeting}! Check out our latest post.",
		variants: options.variants ?? [],
		imagePaths: [],
		includeLink: false,
		createdAt: options.createdAt ?? new Date("2026-04-01T00:00:00Z"),
		updatedAt: options.updatedAt ?? new Date("2026-04-01T00:00:00Z"),
	}
}

export function createTemplateFixtures(count: number, options: CreateTemplateFixtureOptions = {}): Template[] {
	return Array.from({ length: count }, (_, index) => {
		const allPlatforms = ["facebook", "instagram", "twitter", "linkedin"]
		const platform = allPlatforms[index % 4]
		if (platform === undefined) {
			throw new Error("Platform is undefined")
		}
		return createTemplateFixture({
			...options,
			id: options.id ? `${options.id}_${index}` : `tpl_test${String(index + 1).padStart(3, "0")}`,
			name: options.name ?? `Template ${index + 1}`,
			platforms: [platform],
		})
	})
}

export const mockFacebookTemplate = createTemplateFixture({
	id: "tpl_facebook",
	name: "Facebook Promotional",
	content: "🚀 {headline} {offer} Get it now! {cta}",
	platforms: ["facebook"],
})

export const mockInstagramTemplate = createTemplateFixture({
	id: "tpl_instagram",
	name: "Instagram Story",
	content: "✨ {hook}\n\n{body}\n\n{closing}",
	platforms: ["instagram"],
})

export const mockTwitterTemplate = createTemplateFixture({
	id: "tpl_twitter",
	name: "Twitter Update",
	content: "{tweet}",
	platforms: ["twitter"],
})

export const mockLinkedinTemplate = createTemplateFixture({
	id: "tpl_linkedin",
	name: "LinkedIn Professional",
	content: "{intro}\n\n{insight}\n\n{question}",
	platforms: ["linkedin"],
})
