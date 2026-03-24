import { logger } from "@repo/logger";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../../config/env.js";
import type { AuthenticatedUser } from "../types/user.types.js";
import { AUTH_COOKIE_NAME } from "../utils/auth-cookie.js";

const socketLogger = logger.child({ module: "socket-server" });

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
};

const isAuthenticatedPayload = (
  payload: string | jwt.JwtPayload
): payload is jwt.JwtPayload & { _id: string; email: string; name: string } => {
  return typeof payload !== "string"
    && typeof payload._id === "string"
    && typeof payload.email === "string"
    && typeof payload.name === "string";
};

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", env.CLIENT_URL],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

      if (!isAuthenticatedPayload(decoded)) {
        return next(new Error("Invalid authentication token"));
      }

      (socket.data as { user?: AuthenticatedUser }).user = {
        id: decoded._id.toString(),
        email: decoded.email,
        name: decoded.name
      };

      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socketLogger.info("Socket client connected", {
      socketId: socket.id,
      userId: (socket.data as { user?: AuthenticatedUser }).user?.id
    });

    socket.on("disconnect", () => {
      socketLogger.info("Socket client disconnected", {
        socketId: socket.id,
        userId: (socket.data as { user?: AuthenticatedUser }).user?.id
      });
    });
  });

  return io;
};
