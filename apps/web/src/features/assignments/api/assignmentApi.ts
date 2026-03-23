import { baseApi } from "@/redux/apis/baseApi"
import type {
  AssignmentRecord,
  AssignmentSectionInput,
  CreateGenerationResult,
  GenerationRecord,
  SourceMaterialInput,
} from "@/features/assignments/types/assignment.types"

type ApiResponse<T> = {
  data: T
}

export type CreateAssignmentPayload = {
  title: string
  instructions: string
  dueDate: string
  sections: AssignmentSectionInput[]
  sourceMaterial?: SourceMaterialInput
}

export type UpdateAssignmentPayload = {
  instructions?: string
  sourceMaterial?: SourceMaterialInput
}

export type CreateGenerationPayload = {
  assignmentId: string
  promptOverride?: string
}

export const assignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssignments: builder.query<AssignmentRecord[], void>({
      query: () => "assignments",
      providesTags: ["Assignments"],
      transformResponse: (response: ApiResponse<AssignmentRecord[]>) => response.data,
    }),
    getGenerations: builder.query<GenerationRecord[], void>({
      query: () => "generations",
      providesTags: ["Generations"],
      transformResponse: (response: ApiResponse<GenerationRecord[]>) => response.data,
    }),
    createAssignment: builder.mutation<AssignmentRecord, CreateAssignmentPayload>({
      query: (payload) => ({
        url: "assignments",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Assignments"],
      transformResponse: (response: ApiResponse<AssignmentRecord>) => response.data,
    }),
    updateAssignment: builder.mutation<AssignmentRecord, { id: string; payload: UpdateAssignmentPayload }>({
      query: ({ id, payload }) => ({
        url: `assignments/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Assignments"],
      transformResponse: (response: ApiResponse<AssignmentRecord>) => response.data,
    }),
    createGeneration: builder.mutation<CreateGenerationResult, CreateGenerationPayload>({
      query: (payload) => ({
        url: "generations",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Generations"],
      transformResponse: (response: ApiResponse<CreateGenerationResult>) => response.data,
    }),
  }),
})

export const {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
  useGetGenerationsQuery,
} = assignmentApi
