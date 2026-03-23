import { AssignmentDetailsPageView } from "@/features/assignment-details/components/AssignmentDetailsPageView"
import { useAssignmentDetailsPage } from "@/features/assignment-details/hooks/useAssignmentDetailsPage"

export const AssignmentDetailsPage = () => {
  const model = useAssignmentDetailsPage()

  return <AssignmentDetailsPageView model={model} />
}
