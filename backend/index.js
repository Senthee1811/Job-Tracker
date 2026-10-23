 import express from "express"; 
import cors from "cors"; 
import dotenv from "dotenv"; 
import { connectDB } from './lib/db.js';
import { userRouter } from "./routes/userRouter.js";
import { applicationRouter } from "./routes/applicationRouter.js";
import { jobsRouter } from "./routes/jobsRouter.js";
import { reminderRouter } from "./routes/reminderRouter.js";
import { cvRouter } from "./routes/cvRouter.js";
import { recommendationRouter } from "./routes/recommendationRouter.js";
import { initScheduler } from "./services/schedulerService.js";


dotenv.config()



const app = express(); 

app.use(cors()); 
app.use(express.json()); 

const port = process.env.PORT || 8000; 

await connectDB();
initScheduler();

app.listen(port, () => {
    console.log("Server started on ", port);
}); 

app.get("/", (req,res) => {
    res.send("Server is Working");
})

app.use("/api/users", userRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/cv", cvRouter);
app.use("/api/recommendations", recommendationRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});