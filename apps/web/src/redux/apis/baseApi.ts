import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3001/api/",
  credentials: "include",
})

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Assignments", "Generations"],
  endpoints: (_builder) => ({}),
})
