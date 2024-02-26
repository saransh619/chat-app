import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token Missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = { ...decoded, token };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid Token' });
  }
};

export default verifyToken;
