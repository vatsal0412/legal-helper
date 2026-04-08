import { CircleUserRound, MessageSquare, Plus, Trash2, X } from 'lucide-react';

export function Sidebar({
	chats,
	activeChatId,
	onSelectChat,
	onNewChat,
	onDeleteChat,
	isOpen,
	onClose,
}) {
	return (
		<aside
			className={`fixed inset-y-0 left-0 z-30 w-72 flex flex-col h-screen bg-surface-secondary border-r border-surface-tertiary shadow-md transform transition-transform duration-200 ${
				isOpen ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			{/* Header */}
			<div className="p-4 border-b border-surface-tertiary">
				<div className="mb-3 flex items-center justify-between">
					<h1 className="text-heading text-foreground font-bold">
						Conversations
					</h1>
					<button
						onClick={onClose}
						className="btn-ghost px-2 py-1"
						type="button"
					>
						<X className="h-[18px] w-[18px]" />
					</button>
				</div>
				<button
					onClick={onNewChat}
					className="w-full btn-primary flex items-center justify-center gap-2 text-xs font-bold tracking-legal rounded-lg"
				>
					<Plus className="h-4 w-4" />
					NEW CASE
				</button>
			</div>

			{/* Chat History */}
			<div className="flex-1 overflow-y-auto scrollbar-thin">
				{chats.length === 0 ?
					<p className="text-caption text-center py-12 text-foreground-muted">
						No conversations yet
					</p>
				:	chats.map(chat => (
						<div
							key={chat._id}
							className={`w-full text-left px-3 py-2.5 transition-all duration-200 flex items-center group ${
								activeChatId === chat._id ?
									'card-active text-foreground bg-surface-tertiary'
								:	'hover:bg-surface-tertiary text-foreground-secondary hover:text-foreground'
							}`}
						>
							<button
								type="button"
								onClick={() => onSelectChat(chat._id)}
								className="flex-1 flex items-center gap-2 min-w-0"
								title={chat.title}
							>
								<MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent-muted" />
								<span className="flex-1 truncate text-sm leading-tight text-left">
									{chat.title}
								</span>
							</button>
							<button
								type="button"
								onClick={e => {
									e.stopPropagation();
									onDeleteChat(chat._id);
								}}
								className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-error/20 hover:text-error text-foreground-muted"
								title="Delete conversation"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
					))
				}
			</div>

			{/* Footer - User section (optional) */}
			<div className="border-t border-surface-tertiary p-3">
				<button className="w-full btn-ghost text-xs justify-start gap-2 text-foreground-muted hover:text-foreground">
					<CircleUserRound className="h-4 w-4" />
					<span className="tracking-legal uppercase">Profile</span>
				</button>
			</div>
		</aside>
	);
}
