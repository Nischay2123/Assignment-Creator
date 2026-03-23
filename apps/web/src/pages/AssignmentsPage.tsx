import { AssignmentsPageView } from "@/features/assignments/components/AssignmentsPageView"
import { useAssignmentsPage } from "@/features/assignments/hooks/useAssignmentsPage"

export const AssignmentsPage = () => {
  const model = useAssignmentsPage()

  return <AssignmentsPageView model={model} />
}
