// Authentication middleware template
const authMiddleware = (req, res, next) => {
    // Extract token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify token (implementation depends on chosen database)
        // const decoded = verifyToken(token);
        // req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export default authMiddleware;