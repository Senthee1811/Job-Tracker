import jwt from "jsonwebtoken"; 

export const authMiddleware = async(req, res, next) => {
    try {
        //getting the token from the req headers
        const authHeader = req.headers.authorization;

        const token = authHeader && authHeader.split(" ")[1]; 
        //check if the token is exists
        if(!token) {
            return res.status(401).json({ message: "Unauthorized! "}); 
        }
         //Token Validation
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 

        if(!decoded){
            return res.status(401).json({ message: "Invalid Token! "});
        }
        req.user = decoded;
        next();
        
    } catch (error) {
        console.error(error.message); 
        return res.status(401).json({ message: "Cannot Use Middleware "});
    }
}