import { useDispatch, useSelector, useStore } from "react-redux"
import type { RootState, AppDispatch } from "./store"

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <TSelected,>(
  selector: (state: RootState) => TSelected
) => useSelector<RootState, TSelected>(selector)
export const useAppStore = () => useStore()
