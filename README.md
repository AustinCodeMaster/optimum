# optimum
A web based digital petty cash tracking system for optimum diagnostics

# Getting started
- cd backend
- npm install
-node index.js

The basic express server runs at http://localhost:3000

## Development Progress

- Set up the Express backend.
- Installed the MariaDB driver and dotenv.
- Configured environment variables for the database.
- Created a reusable MariaDB connection pool.
- Successfully tested the backend-to-database connection.

# JWT Authentication
- Installed jsonwebtoken and configured  aprivate JWT secret using environment varibales
- Updated the login API to generate a signed JWT after successful credential verification.
- The token contains the user's ID and role and expires after one hour.
- Tested successful login in Postman and confirmed that the response includes the JWT and user details.

# Authentication Middleware
- Created middleware/authMiddleware.js to protect API routes
- The middlesware etract the bearer token from the Authorixation header and verifies it using thr JWT secret
- Valid tokens allow the request to continue, while missing or invalid token are rejeceted
- Tested a temporary protected route in Postman:
No token ->410 Unauthorized.
Valid token-> 200 OK with decoded user information

# Role-Based Access Control(RBAC)
- created middleware/roleMiddleware.js to restrict based on user roles.
- Implemented authorizeRole() to check whether the authenticated user's role is permitted to access the route
- Integrated RBAC with JWT authentication middleware so that tokens are verified before role permissions are blocked