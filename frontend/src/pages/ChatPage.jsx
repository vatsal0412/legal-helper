import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowLeft,
	LoaderCircle,
	Menu,
	PenLine,
	Trash2,
	X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { MessageComposer } from '../components/MessageComposer';
import {
	appendUserMessage,
	applyEditedMessage,
	createChat,
	fetchChat,
	resetChatState,
	sendMessage,
} from '../features/chat/chatSlice';

export function ChatPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const {
		currentChat,
		messages,
		thinking,
		streaming,
		currentMessage,
		error,
	} = useSelector(s => s.chat);
	const [chats, setChats] = useState([]);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [editingMessage, setEditingMessage] = useState(null);
	const [editInFlightId, setEditInFlightId] = useState(null);
	const [chatPendingDelete, setChatPendingDelete] = useState(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const loadChats = async () => {
		const { data } = await api.get('/chat');
		setChats(data);
		return data;
	};

	useEffect(() => {
		loadChats();
	}, []);

	useEffect(() => {
		if (!editInFlightId) return;
		if (thinking || streaming) return;
		setEditInFlightId(null);
	}, [editInFlightId, thinking, streaming]);

	const onNewChat = async () => {
		const result = await dispatch(createChat({ title: 'New Chat' }));
		if (!result.error) {
			await loadChats();
			dispatch(fetchChat(result.payload._id));
			setEditingMessage(null);
			if (window.innerWidth < 1024) {
				setSidebarOpen(false);
			}
		}
	};

	const onSelectChat = id => {
		dispatch(fetchChat(id));
		setEditingMessage(null);
		if (window.innerWidth < 1024) {
			setSidebarOpen(false);
		}
	};

	const onDeleteChat = chatId => {
		setChatPendingDelete(chatId);
	};

	const confirmDeleteChat = async () => {
		if (!chatPendingDelete || isDeleting) return;
		setIsDeleting(true);

		try {
			await api.delete(`/chat/${chatPendingDelete}`);
			const refreshedChats = await loadChats();

			if (currentChat?._id === chatPendingDelete) {
				if (refreshedChats.length > 0) {
					dispatch(fetchChat(refreshedChats[0]._id));
				} else {
					dispatch(resetChatState());
				}
				setEditingMessage(null);
			}
		} finally {
			setIsDeleting(false);
			setChatPendingDelete(null);
		}
	};

	const pendingDeleteChatTitle =
		chats.find(chat => chat._id === chatPendingDelete)?.title ||
		'this conversation';

	const onSend = async (content, options = {}) => {
		const { editMessageId } = options;
		let activeChatId = currentChat?._id;
		if (!activeChatId) {
			const result = await dispatch(createChat({ title: 'New Chat' }));
			if (result.error) return;
			activeChatId = result.payload._id;
			await loadChats();
		}

		if (!editMessageId) {
			dispatch(
				appendUserMessage({
					_id: `tmp-${Date.now()}`,
					role: 'user',
					content,
				}),
			);
		} else {
			dispatch(
				applyEditedMessage({
					editMessageId,
					content,
				}),
			);
			setEditInFlightId(editMessageId);
		}

		await dispatch(
			sendMessage({
				chatId: activeChatId,
				payload: {
					content,
					...(editMessageId ? { editMessageId } : {}),
				},
			}),
		);
		await dispatch(fetchChat(activeChatId));
		await loadChats();
		setEditingMessage(null);
	};

	return (
		<div className="flex h-screen bg-surface overflow-hidden relative">
			{chatPendingDelete && (
				<div className="fixed inset-0 z-40 flex items-center justify-center p-4">
					<button
						type="button"
						onClick={() =>
							!isDeleting && setChatPendingDelete(null)
						}
						className="absolute inset-0 bg-black/60"
						aria-label="Close delete confirmation"
					/>
					<div className="relative w-full max-w-md rounded-xs border border-surface-tertiary bg-surface-secondary shadow-md p-6">
						<div className="flex items-start justify-between mb-2">
							<h2 className="text-heading text-foreground font-bold">
								Delete Conversation?
							</h2>
							<button
								type="button"
								onClick={() => setChatPendingDelete(null)}
								disabled={isDeleting}
								className="btn-ghost px-1 py-1"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<p className="text-body text-foreground-secondary mb-1">
							You are about to delete{' '}
							<span className="font-bold text-accent">
								"{pendingDeleteChatTitle}"
							</span>
							. This action cannot be undone.
						</p>
						<p className="text-caption text-foreground-muted mb-6">
							All messages and associated data will be permanently
							removed.
						</p>
						<div className="flex items-center justify-end gap-2">
							<button
								type="button"
								onClick={() => setChatPendingDelete(null)}
								disabled={isDeleting}
								className="btn-secondary"
							>
								Keep
							</button>
							<button
								type="button"
								onClick={confirmDeleteChat}
								disabled={isDeleting}
								className="inline-flex items-center justify-center px-4 py-2.5 bg-error/80 hover:bg-error text-foreground font-bold text-sm rounded-xs shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="inline-flex items-center gap-2">
									{isDeleting ?
										<>
											<LoaderCircle className="h-4 w-4 animate-spin" />
											Deleting...
										</>
									:	<>
											<Trash2 className="h-4 w-4" />
											Delete
										</>
									}
								</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{sidebarOpen && (
				<button
					type="button"
					onClick={() => setSidebarOpen(false)}
					className="lg:hidden fixed inset-0 bg-black/40 z-20"
					aria-label="Close sidebar overlay"
				/>
			)}

			{/* Sidebar */}
			<Sidebar
				chats={chats}
				activeChatId={currentChat?._id}
				onSelectChat={onSelectChat}
				onNewChat={onNewChat}
				onDeleteChat={onDeleteChat}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			{/* Main Chat Area */}
			<section
				className={`flex-1 flex flex-col h-screen overflow-hidden transition-[margin] duration-200 bg-surface ${
					sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
				}`}
			>
				<div className="border-b border-surface-tertiary bg-surface-secondary px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
					<div className="flex items-center gap-3 min-w-0">
						<button
							type="button"
							onClick={() => navigate('/dashboard')}
							className="btn-ghost px-2 py-1"
							title="Back to dashboard"
						>
							<ArrowLeft className="h-[18px] w-[18px]" />
						</button>
						<button
							type="button"
							onClick={() => setSidebarOpen(prev => !prev)}
							className="btn-ghost px-2 py-1"
							title="Toggle sidebar"
						>
							<Menu className="h-[18px] w-[18px]" />
						</button>
						<div className="min-w-0">
							<h1 className="text-heading text-foreground truncate font-bold">
								{currentChat?.title || 'Legal AI Assistant'}
							</h1>
							<p className="text-caption text-foreground-muted">
								{editingMessage ?
									<span className="inline-flex items-center gap-2">
										<PenLine className="h-3.5 w-3.5" />
										Editing message
									</span>
								:	'Ask your legal question...'}
							</p>
						</div>
					</div>
				</div>

				{/* Chat Messages Container */}
				<div className="flex-1 overflow-y-auto">
					<ChatWindow
						messages={
							editInFlightId ?
								messages.slice(
									0,
									messages.findIndex(
										msg => msg._id === editInFlightId,
									) + 1,
								)
							:	messages
						}
						thinking={thinking}
						streaming={streaming}
						currentMessage={currentMessage}
						error={error}
						onEditMessage={setEditingMessage}
					/>
				</div>

				{/* Input Section - Sticky Bottom */}
				<div className="border-t border-surface-tertiary bg-surface-secondary shadow-lg">
					<MessageComposer
						onSend={onSend}
						disabled={thinking || streaming}
						editingMessage={editingMessage}
						onCancelEdit={() => setEditingMessage(null)}
					/>
				</div>
			</section>
		</div>
	);
}
