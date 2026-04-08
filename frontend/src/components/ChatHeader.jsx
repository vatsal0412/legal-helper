import { MoreHorizontal, Search } from 'lucide-react';

export function ChatHeader({ currentChat }) {
	return (
		<div className="sticky top-0 bg-surface-secondary border-b border-surface-tertiary px-6 py-4 shadow-xs z-10">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-heading text-foreground truncate font-bold">
						{currentChat?.title || 'Legal AI Assistant'}
					</h1>
					{currentChat?.createdAt && (
						<p className="text-caption text-foreground-muted mt-0.5">
							Started{' '}
							{new Date(
								currentChat.createdAt,
							).toLocaleDateString()}
						</p>
					)}
				</div>

				{/* Header Actions */}
				<div className="flex items-center gap-1">
					<button className="btn-ghost p-2" title="Search">
						<Search className="h-[18px] w-[18px]" />
					</button>
					<button className="btn-ghost p-2" title="More options">
						<MoreHorizontal className="h-[18px] w-[18px]" />
					</button>
				</div>
			</div>
		</div>
	);
}
