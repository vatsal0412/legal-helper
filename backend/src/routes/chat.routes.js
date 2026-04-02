import { Router } from 'express';
import {
	createChat,
	createMessage,
	deleteChat,
	getChatById,
	listChats,
} from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createChatSchema, sendMessageSchema } from '../services/validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listChats);
router.post('/', validateBody(createChatSchema), createChat);
router.get('/:id', getChatById);
router.delete('/:id', deleteChat);
router.post('/:id/message', validateBody(sendMessageSchema), createMessage);

export { router as chatRouter };
