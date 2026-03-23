import type { CookieOptions, Response } from "express";

import { env } from "../../config/env.js";

export const AUTH_COOKIE_NAME = "accessToken";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/"
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
};