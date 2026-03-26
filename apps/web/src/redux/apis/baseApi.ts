import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"

import { clearBrowserSession } from "../../features/auth/lib/authStorage"

export const API_ORIGIN = "http://localhost:3001"
export const API_BASE_URL = `${API_ORIGIN}/api/`

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
})

const shouldHandleUnauthorizedRedirect = (error: FetchBaseQueryError) => {
  if (error.status !== 401 || !("data" in error)) {
    return false
  }

  const message =
    typeof error.data === "object" && error.data !== null && "message" in error.data
      ? String(error.data.message)
      : ""

  return [
    "Authentication required",
    "Invalid authentication token",
    "Invalid or expired authentication token",
  ].includes(message)
}

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return
  }

  clearBrowserSession()

  if (window.location.pathname !== "/login") {
    window.location.assign("/login")
  }
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && shouldHandleUnauthorizedRedirect(result.error)) {
    redirectToLogin()
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Assignments", "Generations"],
  endpoints: (_builder) => ({}),
})
