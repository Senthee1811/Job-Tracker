 import express from "express"; 
import cors from "cors"; 
import dotenv from "dotenv"; 
import { connectDB } from './lib/db.js';
import { userRouter } from "./routes/userRouter.js";
import { applicationRouter } from "./routes/applicationRouter.js";


dotenv.config()



const app = express(); 

app.use(cors()); 
app.use(express.json()); 

const port = process.env.PORT; 

await connectDB();

app.listen(port, () => {
    console.log("Server started on ", port);
}); 

app.get("/", (req,res) => {
    res.send("Server is Working");
})

app.use("/api/users", userRouter);
app.use("/api/applications", applicationRouter);



    