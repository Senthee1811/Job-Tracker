import { Application } from "../models/Application.js";
import { User } from "../models/User.js";


export const createApplication = async (req, res) => {
    const { title, requirements, mode, salary, location, status, company } = req.body; 
    const userId = req.user.userId; //From Middleware

    if(!title || !requirements || !mode || !salary || !location || !status){
        return res.status(400).json({ message: "All fields are required "});
    }

    try {
        //Create Application
        const application = await Application.create({ title, requirements, mode, salary, location, userId, status, company });  

        if(!application){
            return res.status(400).json({ message: "Cannot create an Application"});    
        } 


        //Link to User Application 
        await User.findByIdAndUpdate(userId, { $push: { applications: application._id} });
        return res.status(201).json({ message: "Application created ssuccessfully!", application})
        
        
        
    } catch (error) {
        console.error(error.message); 
        return res.status(500).json({ message: "Cannot create job application "});
    }
}

export const getAllApplications = async (req,res) => {
    const userId = req.user.userId;
    const MAX_APPLICATIONS = 10;

    try {
        const applications = await Application.find({ userId: userId }).limit(MAX_APPLICATIONS); 

        if(applications.length === 0){
            return res.status(404).json({ message: "No Applications Found!! "});
        }

        return res.status(200).json({ message: "Applications Fetched Successfully ", applications });

        
    } catch (error) {
        console.log(error.message); 
        return res.status(500).json({ message: "Cannot get all applications "});
    }
} 

export const modifyApplication = async(req,res) => {
    const {applicationId} = req.params; 
    const updateData = req.body;
    

    try {
        const application = await Application.findByIdAndUpdate(applicationId, { $set: updateData },{ new: true, runValidators: true });

        if(!application){
            return res.status(404).json({ message: "Application Not Found "});
        }

        return res.status(200).json({ message: "Application Modified Successfully", application });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Cannot modify the application "});
    }
} 

export const deleteApplication = async(req,res) => {
    try {
        const {applicationId} = req.params; 

        const application = await Application.findByIdAndDelete(applicationId); 
        
        return res.status(200).json({ message: "Application Deleted Successfully", application });
        
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Cannot Delete the Application "});
    }
}