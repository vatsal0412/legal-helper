import { LoaderCircle, PenLine, Search, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function MessageComposer({
	onSend,
	disabled,
	editingMessage,
	onCancelEdit,
}) {
	const [value, setValue] = useState('');
	const textareaRef = useRef(null);

	useEffect(() => {
		if (!editingMessage) return;
		setValue(editingMessage.content || '');
		textareaRef.current?.focus();
	}, [editingMessage]);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
	}, [value]);

	const submit = e => {
		e.preventDefault();
		if (!value.trim()) return;
		onSend(value.trim(), {
			editMessageId: editingMessage?._id,
		});
		setValue('');
		onCancelEdit?.();
	};

	const handleKeyDown = e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit(e);
		}
	};

	return (
		<form className="w-full px-6 py-4" onSubmit={submit}>
			{editingMessage && (
				<div className="max-w-4xl mx-auto mb-2 flex items-center justify-between rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm text-foreground">
					<span className="flex items-center gap-2 font-semibold">
						<PenLine className="h-4 w-4" />
						Editing message
					</span>
					<button
						type="button"
						onClick={() => {
							setValue('');
							onCancelEdit?.();
						}}
						className="btn-ghost px-2 py-1 text-xs"
					>
						Cancel
					</button>
				</div>
			)}
			<div className="max-w-4xl mx-auto flex gap-2 items-end">
				{/* Input Field */}
				<div className="input-field flex items-center gap-3 p-2">
					<Search className="h-[18px] w-[18px] text-foreground-muted flex-shrink-0" />
					<textarea
						ref={textareaRef}
						value={value}
						onChange={e => setValue(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={disabled}
						placeholder="Ask a legal question... (Shift + Enter for new line)"
						className="flex-1 bg-transparent outline-none resize-none text-body placeholder-foreground-muted disabled:opacity-50 disabled:cursor-not-allowed font-body overflow-y-auto"
						rows="1"
					/>
				</div>

				{/* Send Button */}
				<button
					type="submit"
					disabled={disabled || !value.trim()}
					className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
					title="Send message (Enter)"
				>
					<Send className="h-4 w-4" />
					<span className="hidden sm:inline text-xs font-semibold tracking-legal">
						Send
					</span>
				</button>
			</div>
		</form>
	);
}
