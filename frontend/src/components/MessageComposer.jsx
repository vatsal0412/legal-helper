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
					<span className="font-semibold">✎ Editing message</span>
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
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						className="text-foreground-muted flex-shrink-0"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
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
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5950699 3.19218622,10.7521673 3.50612381,10.7521673 L16.6915026,11.5376542 C16.6915026,11.5376542 17.1624089,11.5376542 17.1624089,12.0089463 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
					</svg>
					<span className="hidden sm:inline text-xs font-semibold tracking-legal">
						Send
					</span>
				</button>
			</div>
		</form>
	);
}
