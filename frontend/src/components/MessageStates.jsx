import { MessageSquareText } from 'lucide-react';

export function TypingIndicator({ text = 'Analyzing your question...' }) {
	return (
		<div className="fade-in flex justify-start">
			<div className="card px-4 py-3 flex items-center gap-3 max-w-sm">
				<div className="flex gap-1.5">
					{[0, 1, 2].map(i => (
						<div
							key={i}
							className="w-2 h-2 bg-neutral-400 rounded-full"
							style={{
								animation: `bounce 1.4s infinite`,
								animationDelay: `${i * 0.2}s`,
							}}
						/>
					))}
				</div>
				<span className="text-body text-neutral-600">{text}</span>
			</div>
		</div>
	);
}

export function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center py-12">
			<div className="mb-6">
				<div className="w-16 h-16 rounded-full border border-accent/40 flex items-center justify-center mx-auto text-accent">
					<MessageSquareText className="h-8 w-8" />
				</div>
			</div>
			<h2 className="text-heading-lg text-ink mb-2">
				Welcome to Legal AI
			</h2>
			<p className="text-body text-neutral-600 max-w-md mb-6">
				Start a new conversation by asking a legal question. Our AI will
				analyze your query and provide relevant legal insights.
			</p>
			<div className="space-y-2 text-sm text-neutral-600">
				<p className="font-semibold mb-3">Try asking about:</p>
				<div className="space-y-1.5">
					<p>• Contract terms and conditions</p>
					<p>• Legal compliance requirements</p>
					<p>• Rights and obligations</p>
				</div>
			</div>
		</div>
	);
}
