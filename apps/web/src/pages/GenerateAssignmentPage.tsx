import { GenerateAssignmentPageView } from "@/features/assignment-generator/components/GenerateAssignmentPageView"
import { useGenerateAssignmentPage } from "@/features/assignment-generator/hooks/useGenerateAssignmentPage"

export const GenerateAssignmentPage = () => {
  const model = useGenerateAssignmentPage()

  return <GenerateAssignmentPageView model={model} />
}
