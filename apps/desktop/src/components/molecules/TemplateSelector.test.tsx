import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Template } from "@social-pip/types";
import { TemplateSelector } from "./TemplateSelector";

const mockTemplates: Template[] = [
	{
		id: "template_1",
		name: "Marketing Post",
		sector: "Marketing",
		platforms: ["facebook", "instagram"],
		content: "Check out our latest product!",
		variants: ["Variant A", "Variant B"],
		imagePaths: [],
		includeLink: true,
		linkUrl: "https://example.com",
		createdAt: new Date("2026-04-10T10:00:00Z"),
		updatedAt: new Date("2026-04-10T10:00:00Z"),
	},
	{
		id: "template_2",
		name: "Announcement",
		sector: "News",
		platforms: ["twitter", "linkedin"],
		content: "Big news coming soon!",
		variants: [],
		imagePaths: [],
		includeLink: false,
		createdAt: new Date("2026-04-10T11:00:00Z"),
		updatedAt: new Date("2026-04-10T11:00:00Z"),
	},
];

describe("TemplateSelector", () => {
	it("renders template list", () => {
		render(<TemplateSelector templates={mockTemplates} />);

		expect(screen.getByText("Marketing Post")).toBeInTheDocument();
		expect(screen.getByText("Announcement")).toBeInTheDocument();
	});

	it("renders sector badges", () => {
		render(<TemplateSelector templates={mockTemplates} />);

		const badges = document.querySelectorAll(".bg-gray-100");
		expect(badges.length).toBeGreaterThanOrEqual(2);
	});

	it("filters templates by sector", () => {
		const onSelect = vi.fn();
		render(<TemplateSelector templates={mockTemplates} onSelect={onSelect} />);

		const sectorFilter = screen.getByLabelText("Filter by sector");
		fireEvent.change(sectorFilter, { target: { value: "Marketing" } });

		expect(screen.getByText("Marketing Post")).toBeInTheDocument();
		expect(screen.queryByText("Announcement")).not.toBeInTheDocument();
	});

	it("calls onSelect when template clicked", () => {
		const onSelect = vi.fn();
		render(<TemplateSelector templates={mockTemplates} onSelect={onSelect} />);

		fireEvent.click(screen.getByText("Marketing Post"));

		expect(onSelect).toHaveBeenCalledWith(mockTemplates[0]);
	});

	it("shows preview on hover", () => {
		render(<TemplateSelector templates={mockTemplates} />);

		const templateCard = screen.getByText("Marketing Post").closest("div");
		fireEvent.mouseEnter(templateCard!);

		expect(
			screen.getByText(/Check out our latest product/i),
		).toBeInTheDocument();
	});

	it("shows empty state when no templates", () => {
		render(<TemplateSelector templates={[]} />);

		expect(screen.getByText("No templates available")).toBeInTheDocument();
	});

	it("shows platform icons", () => {
		render(<TemplateSelector templates={mockTemplates} />);

		expect(screen.getByLabelText("facebook icon")).toBeInTheDocument();
		expect(screen.getByLabelText("instagram icon")).toBeInTheDocument();
	});
});
