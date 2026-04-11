import { Button } from "@/components/atoms/Button";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import type {
	AICaptionTone,
	AIProvider,
	GenerateCaptionOutput,
	Platform,
} from "@social-pip/types";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import {
	type ChangeEvent,
	type FC,
	type FormEvent,
	useCallback,
	useState,
} from "react";

export interface CaptionGeneratorProps {
	initialPlatform?: Platform;
	onCaptionGenerated?: (output: GenerateCaptionOutput) => void;
	className?: string;
}

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
	{ value: "facebook", label: "Facebook" },
	{ value: "instagram", label: "Instagram" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "twitter", label: "Twitter" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "threads", label: "Threads" },
	{ value: "telegram", label: "Telegram" },
	{ value: "whatsapp", label: "WhatsApp" },
];

const TONE_OPTIONS: Array<{ value: AICaptionTone; label: string }> = [
	{ value: "professional", label: "Professional" },
	{ value: "casual", label: "Casual" },
	{ value: "humorous", label: "Humorous" },
	{ value: "inspirational", label: "Inspirational" },
];

const PROVIDER_OPTIONS: Array<{ value: AIProvider; label: string }> = [
	{ value: "nim", label: "NVIDIA NIM" },
	{ value: "openai", label: "OpenAI" },
	{ value: "anthropic", label: "Anthropic" },
];

export const CaptionGenerator: FC<CaptionGeneratorProps> = ({
	initialPlatform = "facebook",
	onCaptionGenerated,
	className,
}) => {
	const { loading, error, selectedProvider, generateCaption, setProvider } =
		useAI();

	const [content, setContent] = useState("");
	const [platform, setPlatform] = useState<Platform>(initialPlatform);
	const [tone, setTone] = useState<AICaptionTone>("professional");
	const [generatedCaption, setGeneratedCaption] =
		useState<GenerateCaptionOutput | null>(null);
	const [copied, setCopied] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	const handleGenerate = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setLocalError(null);

			try {
				const result = await generateCaption({
					content,
					platform,
					tone,
					maxLength: 280,
					includeHashtags: true,
				});

				setGeneratedCaption(result);
				onCaptionGenerated?.(result);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Generation failed";
				setLocalError(errorMessage);
			}
		},
		[content, platform, tone, generateCaption, onCaptionGenerated],
	);

	const handleCopy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API not available
		}
	}, []);

	const handleProviderChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			setProvider(e.target.value as AIProvider);
		},
		[setProvider],
	);

	const canGenerate = content.trim().length > 0 && !loading;

	const displayError = localError ?? error;

	return (
		<div className={cn("space-y-6", className)} data-testid="caption-generator">
			<form onSubmit={handleGenerate} className="space-y-4">
				<div>
					<label
						htmlFor="content"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Content
					</label>
					<textarea
						id="content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Enter the content you want to generate a caption for..."
						className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
						rows={4}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<label
							htmlFor="platform"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Platform
						</label>
						<select
							id="platform"
							value={platform}
							onChange={(e) => setPlatform(e.target.value as Platform)}
							className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
						>
							{PLATFORM_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="tone"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Tone
						</label>
						<select
							id="tone"
							value={tone}
							onChange={(e) => setTone(e.target.value as AICaptionTone)}
							className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
						>
							{TONE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="provider"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Provider
						</label>
						<select
							id="provider"
							value={selectedProvider}
							onChange={handleProviderChange}
							className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
						>
							{PROVIDER_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<Button
					type="submit"
					variant="primary"
					disabled={!canGenerate}
					aria-busy={loading}
					className="w-full sm:w-auto"
				>
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Generating...
						</>
					) : (
						<>
							<Sparkles className="h-4 w-4 mr-2" />
							Generate Caption
						</>
					)}
				</Button>
			</form>

			{displayError && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-600">{displayError}</p>
				</div>
			)}

			{generatedCaption && (
				<div className="space-y-4">
					<div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
						<div className="flex justify-between items-start mb-2">
							<h3 className="text-sm font-medium text-gray-700">
								Generated Caption
							</h3>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => handleCopy(generatedCaption.caption)}
								className="h-8"
							>
								{copied ? (
									<>
										<Check className="h-4 w-4 mr-1" />
										Copied
									</>
								) : (
									<>
										<Copy className="h-4 w-4 mr-1" />
										Copy
									</>
								)}
							</Button>
						</div>
						<p className="text-gray-900">{generatedCaption.caption}</p>

						{generatedCaption.hashtags.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{generatedCaption.hashtags.map((tag, index) => (
									<span
										key={index}
										className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>

					{generatedCaption.alternatives.length > 0 && (
						<div className="space-y-2">
							<h4 className="text-sm font-medium text-gray-700">
								Alternatives
							</h4>
							<div className="space-y-2">
								{generatedCaption.alternatives.map((alt, index) => (
									<div
										key={index}
										className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
										onClick={() => handleCopy(alt)}
									>
										<p className="text-sm text-gray-600">{alt}</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
