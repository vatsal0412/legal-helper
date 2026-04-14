import Joi from 'joi';

export const signupSchema = Joi.object({
	name: Joi.string().min(2).max(80).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(8).max(128).required(),
});

export const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
	refreshToken: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
	name: Joi.string().min(2).max(80).optional(),
	avatar: Joi.string().allow('').optional(),
}).min(1);

export const createChatSchema = Joi.object({
	title: Joi.string().max(120).default('New Chat'),
});

export const sendMessageSchema = Joi.object({
	content: Joi.string().min(1).required(),
	fileId: Joi.string().optional(),
	editMessageId: Joi.string().optional(),
});
