import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const API_ORIGIN = "http://localhost:3001"
export const API_BASE_URL = `${API_ORIGIN}/api/`

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
})

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Assignments", "Generations"],
  endpoints: (_builder) => ({}),
})
