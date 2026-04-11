/**
 * @fileoverview 404 Not Found page
 */
export default function NotFoundPage(): React.ReactElement {
	return (
		<div
			data-testid="not-found-page"
			className="p-6 flex flex-col items-center justify-center min-h-[50vh]"
		>
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-muted-foreground mt-2">
				Page not found. The page you are looking for does not exist.
			</p>
		</div>
	);
}
