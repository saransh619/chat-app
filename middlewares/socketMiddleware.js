import jwt from 'jsonwebtoken';

const socketMiddleware = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      // Attach user information to the socket object
      socket.user = decoded.user;
      next();
    });
  });
};

export default socketMiddleware;
