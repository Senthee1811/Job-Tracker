import { Reminder } from "../models/Reminder.js";

export const createReminder = async (req, res) => {
  const { title, description, date, time, color } = req.body;
  const userId = req.user.userId;

  if (!title || !date || !time) {
    return res.status(400).json({ message: "Title, date, and time are required" });
  }

  try {
    const reminder = await Reminder.create({
      userId,
      title,
      description,
      date,
      time,
      color: color || "#a3e635"
    });

    if (!reminder) {
      return res.status(400).json({ message: "Failed to create reminder" });
    }

    return res.status(201).json({ message: "Reminder created successfully", reminder });
  } catch (err) {
    console.error("Create reminder error:", err.message);
    return res.status(500).json({ message: "Cannot create reminder" });
  }
};

export const getReminders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const reminders = await Reminder.find({ userId }).sort({ date: 1, time: 1 });
    return res.status(200).json({ reminders });
  } catch (err) {
    console.error("Get reminders error:", err.message);
    return res.status(500).json({ message: "Cannot fetch reminders" });
  }
};

export const deleteReminder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }
    return res.status(200).json({ message: "Reminder deleted successfully", reminder });
  } catch (err) {
    console.error("Delete reminder error:", err.message);
    return res.status(500).json({ message: "Cannot delete reminder" });
  }
};
