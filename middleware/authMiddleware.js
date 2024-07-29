const env = require('../.env/secret.json');

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if(!token) return res.status(401).json({ message: 'Access denied. No token provided' });

    try {
        const verified = jwt.verify(token, env.JWT_SECRET)
        req.user = verified;

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorizeRole = (role) => {
    const roleLevels = {
        'ADMIN': 3,
        'MANUFACTURER': 2,
        'CLIENT': 1
    }
    return (req, res, next) => {
        if(req.user.roleLevel < roleLevels[role])
            return res.status(403).json({ message: "Access denied" });
        next();
    }
}

function roleAccess(role) {
    const access = {
        'ADMIN': 3,
        'MANUFACTURER': 2,
        'CLIENT': 1
    }

    return access[role]
}

module.exports = {
    authenticateToken,
    authorizeRole
}