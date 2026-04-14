import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { TokenUsage } from '../models/token-usage.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { requestChatStream } from '../services/ai.service.js';
import { logger } from '../config/logger.js';

function parseEventBlock(block) {
	const normalized = block.replace(/\r/g, '');
	const lines = normalized.split('\n');
	let eventName = '';
	const dataLines = [];

	for (const line of lines) {
		if (line.startsWith('event:')) {
			eventName = line.slice(6).trim();
			continue;
		}

		if (line.startsWith('data:')) {
			dataLines.push(line.slice(5).trimStart());
		}
	}

	if (!eventName) {
		return null;
	}

	const rawData = dataLines.join('\n');
	if (!rawData) {
		return { event: eventName, data: {} };
	}

	try {
		return { event: eventName, data: JSON.parse(rawData) };
	} catch {
		return { event: eventName, data: null };
	}
}

export const createChat = asyncHandler(async (req, res) => {
	const chat = await Chat.create({
		userId: req.user._id,
		title: req.body.title,
	});
	res.status(201).json(chat);
});

export const listChats = asyncHandler(async (req, res) => {
	const chats = await Chat.find({ userId: req.user._id }).sort({
		lastMessageAt: -1,
	});
	res.json(chats);
});

export const getChatById = asyncHandler(async (req, res) => {
	const chat = await Chat.findOne({
		_id: req.params.id,
		userId: req.user._id,
	});
	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	const messages = await Message.find({ chatId: chat._id }).sort({
		createdAt: 1,
	});
	res.json({ chat, messages });
});

export const deleteChat = asyncHandler(async (req, res) => {
	const chat = await Chat.findOne({
		_id: req.params.id,
		userId: req.user._id,
	});

	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	await Promise.all([
		Message.deleteMany({ chatId: chat._id }),
		TokenUsage.deleteMany({ chatId: chat._id }),
		Chat.deleteOne({ _id: chat._id }),
	]);

	res.status(204).send();
});

export const createMessage = asyncHandler(async (req, res) => {
	const chat = await Chat.findOne({
		_id: req.params.id,
		userId: req.user._id,
	});
	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	const { content, fileId, editMessageId } = req.body;
	logger.info('chat stream request received', {
		chatId: String(chat._id),
		userId: String(req.user._id),
		fileId: fileId || null,
	});

	if (editMessageId) {
		const edited = await Message.findOne({
			_id: editMessageId,
			chatId: chat._id,
			role: 'user',
		});
		if (!edited) {
			throw new ApiError(404, 'Message to edit not found');
		}
		edited.content = content;
		await edited.save();
	} else {
		await Message.create({
			chatId: chat._id,
			userId: req.user._id,
			role: 'user',
			content,
		});
	}

	const chatHistoryDocs = await Message.find({ chatId: chat._id })
		.sort({ createdAt: 1 })
		.select({ role: 1, content: 1, _id: 0 });
	const history = chatHistoryDocs.map(message => ({
		role: message.role,
		content: message.content,
	}));

	let upstream;
	try {
		upstream = await requestChatStream({
			query: content,
			sessionId: String(chat._id),
			userId: String(req.user._id),
			fileId,
			history,
		});
	} catch {
		logger.error('chat stream upstream connect failed', {
			chatId: String(chat._id),
			userId: String(req.user._id),
		});
		return res.status(500).json({
			message: 'Streaming failed. Try again.',
		});
	}

	logger.info('chat stream upstream connected', {
		chatId: String(chat._id),
		userId: String(req.user._id),
	});

	res.status(200);
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache, no-transform');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no');
	res.flushHeaders();

	let buffer = '';
	let fullText = '';
	let tokenUsage = {};
	let citations = [];
	let upstreamDone = false;
	let finalized = false;
	let clientDisconnected = false;

	req.on('close', () => {
		clientDisconnected = true;
		logger.info('chat stream client disconnected', {
			chatId: String(chat._id),
			userId: String(req.user._id),
		});
		if (upstream?.data && !upstream.data.destroyed) {
			upstream.data.destroy();
		}
	});

	const finalize = async () => {
		if (finalized) {
			return;
		}
		finalized = true;

		if (!clientDisconnected && fullText.trim()) {
			const assistantMessage = await Message.create({
				chatId: chat._id,
				userId: req.user._id,
				role: 'assistant',
				content: fullText,
				citations,
				usage: tokenUsage,
				editedFromMessageId: editMessageId || null,
			});

			if (tokenUsage && Object.keys(tokenUsage).length > 0) {
				await TokenUsage.create({
					userId: req.user._id,
					chatId: chat._id,
					messageId: assistantMessage._id,
					provider: 'gemini',
					inputTokens: tokenUsage.inputTokens || 0,
					outputTokens: tokenUsage.outputTokens || 0,
					totalTokens: tokenUsage.totalTokens || 0,
				});
			}

			chat.lastMessageAt = new Date();
			if (chat.title === 'New Chat') {
				chat.title = content.slice(0, 60);
			}
			await chat.save();
			logger.info('chat stream persisted assistant message', {
				chatId: String(chat._id),
				userId: String(req.user._id),
				chars: fullText.length,
			});
		}

		if (!clientDisconnected && !upstreamDone) {
			res.write(
				`event: done\ndata: ${JSON.stringify({ tokenUsage, citations })}\n\n`,
			);
		}

		if (!clientDisconnected) {
			logger.info('chat stream response finalized', {
				chatId: String(chat._id),
				userId: String(req.user._id),
				upstreamDone,
			});
			res.end();
		}
	};

	upstream.data.on('data', chunk => {
		const payload = chunk.toString('utf8');
		res.write(payload);

		buffer += payload;
		const normalized = buffer.replace(/\r\n/g, '\n');
		let cursor = 0;
		let delimiter = normalized.indexOf('\n\n', cursor);

		while (delimiter !== -1) {
			const block = normalized.slice(cursor, delimiter);
			const parsed = parseEventBlock(block);
			if (parsed?.event === 'delta' && parsed.data?.text) {
				fullText += parsed.data.text;
			}

			if (parsed?.event === 'done') {
				upstreamDone = true;
				tokenUsage = parsed.data?.tokenUsage || {};
				citations = parsed.data?.citations || [];
			}

			if (parsed?.event === 'error') {
				upstreamDone = true;
			}

			cursor = delimiter + 2;
			delimiter = normalized.indexOf('\n\n', cursor);
		}

		buffer = normalized.slice(cursor);
	});

	upstream.data.on('end', () => {
		void finalize();
	});

	upstream.data.on('error', err => {
		logger.error('chat stream upstream error', {
			chatId: String(chat._id),
			userId: String(req.user._id),
			error: err.message,
		});
		if (!clientDisconnected) {
			res.write(
				`event: error\ndata: ${JSON.stringify({ message: err.message || 'Stream proxy failed' })}\n\n`,
			);
		}
		void finalize();
	});
});
