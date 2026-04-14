import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, baseURL, tokenStore } from '../../services/api';

export const createChat = createAsyncThunk('chat/create', async payload => {
	const { data } = await api.post('/chat', payload || {});
	return data;
});

export const fetchChat = createAsyncThunk('chat/fetch', async chatId => {
	const { data } = await api.get(`/chat/${chatId}`);
	return data;
});

export const sendMessage = createAsyncThunk(
	'chat/sendMessage',
	async ({ chatId, payload }, { dispatch, rejectWithValue }) => {
		try {
			console.info('[chat] stream start request', {
				chatId,
			});
			const authToken = tokenStore.getAccess();
			const response = await fetch(`${baseURL}/chat/${chatId}/message`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(authToken ?
						{ Authorization: `Bearer ${authToken}` }
					:	{}),
				},
				body: JSON.stringify(payload),
			});

			const contentType = response.headers.get('content-type') || '';
			if (!response.ok || !contentType.includes('text/event-stream')) {
				let fallback;
				try {
					fallback = await response.json();
				} catch {
					fallback = null;
				}
				const message =
					fallback?.message ||
					fallback?.error?.message ||
					'Streaming failed. Try again.';
				dispatch(streamError({ message }));
				console.error('[chat] stream fallback json response', {
					chatId,
					message,
				});
				return rejectWithValue(message);
			}

			dispatch(streamStart());

			const reader = response.body?.getReader();
			if (!reader) {
				dispatch(
					streamError({ message: 'No stream reader available.' }),
				);
				console.error('[chat] stream reader unavailable', { chatId });
				return rejectWithValue('No stream reader available.');
			}

			const decoder = new TextDecoder();
			let buffer = '';
			let donePayload = { tokenUsage: {}, citations: [] };

			const processEvent = block => {
				const lines = block.replace(/\r/g, '').split('\n');
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
					return;
				}

				let data = {};
				const rawData = dataLines.join('\n');
				if (rawData) {
					try {
						data = JSON.parse(rawData);
					} catch {
						return;
					}
				}

				if (eventName === 'delta' && data.text) {
					dispatch(addToken({ text: data.text }));
				}

				if (eventName === 'done') {
					donePayload = {
						tokenUsage: data.tokenUsage || {},
						citations: data.citations || [],
					};
					console.info('[chat] stream done event', {
						chatId,
						tokenUsage: donePayload.tokenUsage,
						citationCount: donePayload.citations.length,
					});
					dispatch(streamComplete(donePayload));
				}

				if (eventName === 'error') {
					console.error('[chat] stream error event', {
						chatId,
						message: data.message,
					});
					dispatch(
						streamError({
							message:
								data.message || 'Streaming failed. Try again.',
						}),
					);
				}
			};

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const parts = buffer.split('\n\n');
				buffer = parts.pop() || '';

				for (const part of parts) {
					processEvent(part);
				}
			}

			if (buffer.trim()) {
				processEvent(buffer);
			}

			return donePayload;
		} catch (error) {
			const message =
				error?.message || 'Streaming failed due to a network error.';
			dispatch(streamError({ message }));
			console.error('[chat] stream request failed', { chatId, message });
			return rejectWithValue(message);
		}
	},
);

const chatSlice = createSlice({
	name: 'chat',
	initialState: {
		currentChat: null,
		messages: [],
		currentMessage: '',
		streaming: false,
		error: null,
		loading: false,
		thinking: false,
	},
	reducers: {
		appendUserMessage(state, action) {
			state.messages.push(action.payload);
		},
		resetChatState(state) {
			state.currentChat = null;
			state.messages = [];
			state.currentMessage = '';
			state.streaming = false;
			state.thinking = false;
			state.error = null;
		},
		streamStart(state) {
			state.streaming = true;
			state.error = null;
			state.currentMessage = '';
		},
		addToken(state, action) {
			state.thinking = false;
			state.streaming = true;
			state.currentMessage += action.payload.text;
		},
		streamComplete(state) {
			state.streaming = false;
			state.thinking = false;
		},
		streamError(state, action) {
			state.streaming = false;
			state.thinking = false;
			state.error =
				action.payload?.message || 'Streaming failed. Try again.';
		},
	},
	extraReducers: builder => {
		builder
			.addCase(fetchChat.pending, state => {
				state.loading = true;
			})
			.addCase(fetchChat.fulfilled, (state, action) => {
				state.loading = false;
				state.currentChat = action.payload.chat;
				state.messages = action.payload.messages;
				state.currentMessage = '';
				state.error = null;
			})
			.addCase(sendMessage.pending, state => {
				state.thinking = true;
				state.error = null;
			})
			.addCase(sendMessage.fulfilled, state => {
				state.thinking = false;
				state.streaming = false;
			})
			.addCase(sendMessage.rejected, (state, action) => {
				state.thinking = false;
				state.streaming = false;
				if (!state.error && action.payload) {
					state.error = action.payload;
				}
			})
			.addCase(createChat.fulfilled, (state, action) => {
				state.currentChat = action.payload;
				state.messages = [];
				state.currentMessage = '';
				state.error = null;
			});
	},
});

export const {
	appendUserMessage,
	resetChatState,
	streamStart,
	addToken,
	streamComplete,
	streamError,
} = chatSlice.actions;
export default chatSlice.reducer;
