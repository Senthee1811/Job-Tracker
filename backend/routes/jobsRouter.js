import express from 'express';
import { getLiveJobs } from '../controllers/jobsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const jobsRouter = express.Router();

jobsRouter.get('/search', authMiddleware, getLiveJobs);
