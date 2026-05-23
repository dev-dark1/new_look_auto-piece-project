const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole === 'admin') {
        next();
        return;
    }
    res.status(403).send({ message: 'Require Admin Role!' });
};

const authJwt = {
    verifyToken: verifyToken,
    isAdmin: isAdmin
};

module.exports = authJwt;
