import jwt from 'jsonwebtoken';

const socketMiddleware = (socket, next) => {
  // Extract token from socket handshake query
  const token = socket.handshake.auth.token;
  console.log("token", token);

  if (!token) {
    // If no token is provided, reject the connection
    return next(new Error('Unauthorized: Token Missing'));
  }

  try {
    // Verify the token and attach user information to the socket
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    socket.userData = decoded;
        // Set receiver_id in socket data
        socket.receiver_id = decoded?.receiver_id;
    next();
  } catch (error) {
    // If token verification fails, reject the connection
    return next(new Error('Unauthorized: Invalid Token'));
  }
};

export default socketMiddleware;
