import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const client = axios.create({
	baseURL: env.aiServiceUrl,
	timeout: 60000,
});

export async function requestChatStream(payload) {
	logger.info('ai-service stream request', {
		endpoint: '/chat/stream',
		sessionId: payload.sessionId,
		userId: payload.userId,
	});
	return client.post('/chat/stream', payload, {
		responseType: 'stream',
		timeout: 0,
	});
}

export async function requestDocumentChat(payload) {
	const { data } = await client.post('/pdf/chat', payload);
	return data;
}

export async function uploadToAiService({
	filePath,
	fileId,
	userId,
	checksum,
}) {
	const form = new FormData();
	form.append('file', fs.createReadStream(filePath));
	form.append('file_id', fileId);
	form.append('user_id', userId);
	form.append('checksum', checksum);

	const { data } = await client.post('/upload', form, {
		headers: form.getHeaders(),
	});
	return data;
}
