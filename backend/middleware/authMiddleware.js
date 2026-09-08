//This file is used to check whether a request has a valid jwt before allowing it to continue
const jwt = require("jsonwebtoken");

//Midleware to verify JWT tokens
function authenticateToken(req, res, next) {

    //Get the Authorization header
    const authHeader = req.headers["authorization"];

    //Extract the token from "Bearer <token>"
    const token = authHeader && authHeader.split(" ")[1];

    //If no token is provided, deny access
    if(!token) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    try {
        //Verify the token is using the JWT secret
        const user = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        //Store the decoded user information in the request
        req.user = user;

        //continue to the protected route
        next();

    } catch(error) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authenticateToken;