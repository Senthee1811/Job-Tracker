import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createReminder, getReminders, deleteReminder } from "../controllers/reminderController.js";

const reminderRouter = express.Router();

reminderRouter.post("/", authMiddleware, createReminder);
reminderRouter.get("/", authMiddleware, getReminders);
reminderRouter.delete("/:id", authMiddleware, deleteReminder);

export { reminderRouter };
