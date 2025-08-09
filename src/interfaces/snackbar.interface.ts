export interface SnackbarState {
  open: boolean
  message: string
  severity?: 'success' | 'error' | 'warning' | 'info'
}