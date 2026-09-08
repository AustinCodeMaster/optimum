function authorizeRole(...allowedRoles) {
    return (req, res, next) => {

        //check whether the user's role is allowed
        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        //Continue if the role is allowed
        next();
    };
}

module.exports = authorizeRole;