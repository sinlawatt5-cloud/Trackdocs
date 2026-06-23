import type { Role } from '../types'

export const roleLabels: Record<Role, string> = {
  customer: 'Customer',
  operation: 'Operation',
  admin: 'Admin',
}

export const roleHomePath: Record<Role, string> = {
  customer: '/customer/dashboard',
  operation: '/operation/dashboard',
  admin: '/admin/dashboard',
}

export const roleAccent: Record<Role, string> = {
  customer: 'cyan',
  operation: 'amber',
  admin: 'violet',
}

export function isRole(value: string | undefined | null): value is Role {
  return value === 'customer' || value === 'operation' || value === 'admin'
}

export function canAccessRole(userRole: Role, allow: Role[]) {
  return allow.includes(userRole)
}
