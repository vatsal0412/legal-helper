import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const hasBeenEdited = msg => {
	if (!msg.createdAt || !msg.updatedAt) {
		return false;
	}

	return (
		new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() >
		1000
	);
};

export function ChatWindow({
	messages,
	thinking,
	streaming,
	currentMessage,
	error,
	onEditMessage,
}) {
	return (
		<div className="flex flex-col w-full h-full">
			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8 space-y-6">
				{messages.length === 0 ?
					<div className="flex flex-col items-center justify-center h-full text-center py-12">
						<div className="mb-6">
							<div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									width="32"
									height="32"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									className="text-surface"
								>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
							</div>
						</div>
						<h2 className="text-heading-lg text-foreground mb-2">
							Welcome to Legal AI
						</h2>
						<p className="text-body text-foreground-muted max-w-md mb-6">
							Start a conversation by asking a legal question. Our
							AI will analyze your query and provide relevant
							legal insights.
						</p>
					</div>
				:	messages.map((msg, idx) => (
						<div
							key={msg._id || idx}
							className={`fade-up flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}
							style={{
								animationDelay: `${idx * 50}ms`,
							}}
						>
							<div
								className={`${
									msg.role === 'user' ? 'max-w-lg' : 'w-full'
								}`}
							>
								{/* User Message */}
								{msg.role === 'user' && (
									<div className="flex gap-3 justify-end group">
										<div className="message-user">
											{onEditMessage && (
												<button
													type="button"
													onClick={() =>
														onEditMessage(msg)
													}
													className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 btn-ghost"
													title="Edit message"
												>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
													>
														<path d="M12 20h9" />
														<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
													</svg>
												</button>
											)}
											<p className="text-body-lg leading-relaxed">
												{msg.content}
											</p>
											{hasBeenEdited(msg) && (
												<p className="text-[11px] text-accent-light mt-1">
													edited
												</p>
											)}
										</div>
									</div>
								)}

								{/* Assistant Message */}
								{msg.role === 'assistant' && (
									<div className="message-assistant">
										<div className="markdown text-body-lg leading-relaxed text-foreground">
											<Markdown
												remarkPlugins={[remarkGfm]}
											>
												{msg.content}
											</Markdown>
										</div>

										{/* Citations Section */}
										{msg.citations &&
											msg.citations.length > 0 && (
												<div className="mt-4 pt-4 border-t border-surface-tertiary">
													<p className="text-caption font-semibold mb-3 text-accent">
														📚 SOURCES & REFERENCES
													</p>
													<div className="space-y-2">
														{msg.citations.map(
															(c, cidx) => (
																<div
																	key={`${c.documentId}-${c.chunkId}-${cidx}`}
																	className="px-3 py-2.5 card text-foreground text-caption hover:border-accent transition-all"
																>
																	<div className="flex items-center justify-between">
																		<span className="font-mono">
																			<strong className="text-accent">
																				Doc{' '}
																				{
																					c.documentId
																				}
																			</strong>
																			{
																				' - Chunk '
																			}
																			{
																				c.chunkId
																			}
																		</span>
																		<span className="text-foreground-muted">
																			{Number(
																				c.score ||
																					0,
																			).toFixed(
																				2,
																			)}{' '}
																			rel.
																		</span>
																	</div>
																</div>
															),
														)}
													</div>
												</div>
											)}
									</div>
								)}
							</div>
						</div>
					))
				}

				{/* Thinking State */}
				{thinking && (
					<div className="fade-in flex justify-start">
						<div className="card px-4 py-3 flex items-center gap-3 max-w-sm">
							<div className="flex gap-1.5">
								{[0, 1, 2].map(i => (
									<div
										key={i}
										className="w-2 h-2 bg-accent rounded-full"
										style={{
											animation: `pulse-subtle 1.4s infinite`,
											animationDelay: `${i * 0.2}s`,
										}}
									/>
								))}
							</div>
							<span className="text-body text-foreground-muted">
								Analyzing your question...
							</span>
						</div>
					</div>
				)}

				{(streaming || currentMessage) && (
					<div className="fade-in flex justify-start w-full">
						<div className="w-full message-assistant">
							<div className="markdown text-body-lg leading-relaxed text-foreground">
								<Markdown remarkPlugins={[remarkGfm]}>
									{currentMessage}
								</Markdown>
							</div>
						</div>
					</div>
				)}

				{error && (
					<div className="fade-in flex justify-start">
						<div className="error-indicator max-w-lg">
							Error: {error}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
