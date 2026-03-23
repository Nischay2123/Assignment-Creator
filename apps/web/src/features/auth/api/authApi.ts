import { baseApi } from "@/redux/apis/baseApi"
import type { AuthUser } from "@/features/auth/types/auth.types"

export interface RequestOtpPayload {
  name: string
  email: string
  password: string
}

export interface RequestOtpResponse {
  message: string
  verificationRequired: boolean
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}

export interface LoginPayload {
  email: string
  password: string
}

export type UserData = AuthUser

export interface VerifyOtpResponse {
  message: string
  user: UserData
  token: string
}

export interface LoginResponse {
  data:{
    message: string
    user: UserData
    token: string
  }  
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation<RequestOtpResponse, RequestOtpPayload>({
      query: (payload) => ({
        url: "users/request-otp",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [],
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpPayload>({
      query: (payload) => ({
        url: "users/verify-otp",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [],
    }),
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (payload) => ({
        url: "users/login",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [],
    }),
  }),
})

export const { useRequestOtpMutation, useVerifyOtpMutation, useLoginMutation } = authApi
