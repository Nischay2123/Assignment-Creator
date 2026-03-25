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
  file?: File
}

export type UpdateAssignmentPayload = {
  instructions?: string
  sourceMaterial?: SourceMaterialInput
  file?: File
}

export type CreateGenerationPayload = {
  assignmentId: string
}

const buildFormData = (data: Record<string, any>, file?: File): FormData | Record<string, any> => {
  if (!file) {
    return data
  }

  const formData = new FormData()
  
  // Add non-file fields
  Object.entries(data).forEach(([key, value]) => {
    if (key !== "file" && value !== undefined) {
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
  })
  
  // Add file
  formData.append("file", file)
  
  return formData
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
      query: (payload) => {
        const { file, ...rest } = payload
        const body = buildFormData(rest, file)
        return {
          url: "assignments",
          method: "POST",
          body,
        }
      },
      invalidatesTags: ["Assignments"],
      transformResponse: (response: ApiResponse<AssignmentRecord>) => response.data,
    }),
    updateAssignment: builder.mutation<AssignmentRecord, { id: string; payload: UpdateAssignmentPayload }>({
      query: ({ id, payload }) => {
        const { file, ...rest } = payload
        const body = buildFormData(rest, file)
        return {
          url: `assignments/${id}`,
          method: "PUT",
          body,
        }
      },
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
