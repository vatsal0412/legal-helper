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
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.35-4.35" />
						</svg>
					</button>
					<button className="btn-ghost p-2" title="More options">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="1" />
							<circle cx="19" cy="12" r="1" />
							<circle cx="5" cy="12" r="1" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
