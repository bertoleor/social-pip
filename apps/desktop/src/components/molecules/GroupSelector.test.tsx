// removed unused import
// removed unused import
import { GroupSelector } from "./GroupSelector";

const mockGroups = [
	{
		id: "1",
		name: "Marketing Group",
		memberCount: 1500,
		privacy: "public" as const,
		lastPostedAt: new Date("2026-04-10"),
	},
	{
		id: "2",
		name: "Private Community",
		memberCount: 500,
		privacy: "private" as const,
	},
	{
		id: "3",
		name: "Tech Enthusiasts",
		memberCount: 5000,
		privacy: "public" as const,
	},
];

describe("GroupSelector", () => {
	describe("rendering", () => {
		it("renders group list", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);
			expect(screen.getByText("Marketing Group")).toBeInTheDocument();
			expect(screen.getByText("Private Community")).toBeInTheDocument();
			expect(screen.getByText("Tech Enthusiasts")).toBeInTheDocument();
		});

		it("shows member counts", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);
			expect(screen.getByText("1.5K members")).toBeInTheDocument();
			expect(screen.getByText("500 members")).toBeInTheDocument();
		});

		it("shows privacy badges", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);
			expect(screen.getByText("public")).toBeInTheDocument();
			expect(screen.getByText("private")).toBeInTheDocument();
		});

		it("shows empty state when no groups", () => {
			render(
				<GroupSelector groups={[]} selectedIds={[]} onChange={() => {}} />,
			);
			expect(screen.getByText("No groups available")).toBeInTheDocument();
		});
	});

	describe("selection", () => {
		it("shows checkboxes for each group", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);
			const checkboxes = document.querySelectorAll('input[type="checkbox"]');
			expect(checkboxes).toHaveLength(4); // 3 groups + 1 search checkbox
		});

		it("calls onChange when group is selected", () => {
			const onChange = vi.fn();
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={onChange}
				/>,
			);

			const firstCheckbox = document.querySelectorAll(
				'input[type="checkbox"]',
			)[1];
			fireEvent.click(firstCheckbox!);

			expect(onChange).toHaveBeenCalledWith(["1"]);
		});

		it("shows selected groups as checked", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={["1", "2"]}
					onChange={() => {}}
				/>,
			);
			const checkboxes = Array.from(
				document.querySelectorAll('input[type="checkbox"]'),
			);
			const groupCheckboxes = checkboxes.slice(1); // Skip search checkbox

			expect(groupCheckboxes[0]).toBeChecked();
			expect(groupCheckboxes[1]).toBeChecked();
			expect(groupCheckboxes[2]).not.toBeChecked();
		});

		it("toggles selection when clicking checked group", () => {
			const onChange = vi.fn();
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={["1"]}
					onChange={onChange}
				/>,
			);

			const firstCheckbox = document.querySelectorAll(
				'input[type="checkbox"]',
			)[1];
			fireEvent.click(firstCheckbox!);

			expect(onChange).toHaveBeenCalledWith([]);
		});
	});

	describe("search/filter", () => {
		it("has search input", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);
			expect(
				screen.getByPlaceholderText("Search groups..."),
			).toBeInTheDocument();
		});

		it("filters groups by search query", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);

			const searchInput = screen.getByPlaceholderText("Search groups...");
			fireEvent.change(searchInput, { target: { value: "tech" } });

			expect(screen.getByText("Tech Enthusiasts")).toBeInTheDocument();
			expect(screen.queryByText("Marketing Group")).not.toBeInTheDocument();
		});

		it("shows no results message when search has no matches", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
				/>,
			);

			const searchInput = screen.getByPlaceholderText("Search groups...");
			fireEvent.change(searchInput, { target: { value: "nonexistent" } });

			expect(
				screen.getByText("No groups match your search"),
			).toBeInTheDocument();
		});
	});

	describe("bulk actions", () => {
		it("has Select All button", () => {
			const onChange = vi.fn();
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={onChange}
				/>,
			);

			fireEvent.click(screen.getByText("Select All"));
			expect(onChange).toHaveBeenCalledWith(["1", "2", "3"]);
		});

		it("has Clear All button", () => {
			const onChange = vi.fn();
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={["1", "2"]}
					onChange={onChange}
				/>,
			);

			fireEvent.click(screen.getByText("Clear All"));
			expect(onChange).toHaveBeenCalledWith([]);
		});

		it("shows selection count", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={["1", "2"]}
					onChange={() => {}}
				/>,
			);
			expect(screen.getByText("2 groups selected")).toBeInTheDocument();
		});
	});

	describe("custom className", () => {
		it("merges custom className", () => {
			render(
				<GroupSelector
					groups={mockGroups}
					selectedIds={[]}
					onChange={() => {}}
					className="custom-class"
				/>,
			);
			const container = document.querySelector(".custom-class");
			expect(container).toBeInTheDocument();
		});
	});
});
