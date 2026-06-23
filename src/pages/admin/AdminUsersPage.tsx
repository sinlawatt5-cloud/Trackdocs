import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState'
import { Input } from '../../components/Input'
import { LoadingState } from '../../components/LoadingState'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { StatusBadge } from '../../components/StatusBadge'
import { listCustomers, listUsers, updateUserProfile } from '../../lib/firestore'
import type { Customer, SessionUser, UserRole } from '../../types'

type UserDraft = {
  uid: string
  displayName: string
  email: string
  role: UserRole
  customerId: string
  customerCode: string
  isActive: boolean
}

const emptyDraft: UserDraft = {
  uid: '',
  displayName: '',
  email: '',
  role: 'customer',
  customerId: '',
  customerCode: '',
  isActive: true,
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'operation', label: 'Operation' },
  { value: 'admin', label: 'Admin' },
]

export function AdminUsersPage() {
  const [users, setUsers] = useState<SessionUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<UserDraft>(emptyDraft)
  const [draftError, setDraftError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [userList, customerList] = await Promise.all([listUsers(), listCustomers()])
      setUsers(userList)
      setCustomers(customerList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.customerId, customer] as const)),
    [customers],
  )

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [users],
  )

  const openEdit = (user: SessionUser) => {
    setDraft({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      customerId: user.customerId ?? '',
      customerCode: user.customerCode ?? '',
      isActive: user.isActive,
    })
    setDraftError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    if (saving) {
      return
    }

    setFormOpen(false)
    setConfirmOpen(false)
    setDraft(emptyDraft)
    setDraftError('')
  }

  const handleCustomerIdChange = (customerId: string) => {
    const customer = customerMap.get(customerId)
    setDraft((current) => ({
      ...current,
      customerId,
      customerCode: customer?.companyCode ?? current.customerCode,
    }))
  }

  const validateDraft = () => {
    if (!draft.uid) {
      setDraftError('ไม่พบข้อมูลผู้ใช้งาน')
      return false
    }

    if (!draft.displayName.trim()) {
      setDraftError('กรุณากรอกชื่อผู้ใช้งาน')
      return false
    }

    if (draft.role === 'customer' && (!draft.customerId.trim() || !draft.customerCode.trim())) {
      setDraftError('ถ้าเลือก role Customer ต้องกำหนด customerId และ customerCode ให้ครบ')
      return false
    }

    setDraftError('')
    return true
  }

  const handleReview = () => {
    if (!validateDraft()) {
      return
    }

    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!validateDraft()) {
      setConfirmOpen(false)
      return
    }

    setSaving(true)
    try {
      await updateUserProfile(draft.uid, {
        displayName: draft.displayName.trim(),
        role: draft.role,
        customerId: draft.customerId.trim() ? draft.customerId.trim() : null,
        customerCode: draft.customerCode.trim() ? draft.customerCode.trim() : null,
        isActive: draft.isActive,
      })
      toast.success('บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว')
      setConfirmOpen(false)
      setFormOpen(false)
      setDraft(emptyDraft)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setSaving(false)
    }
  }

  const pageActions = (
    <div>
      <p className="trackdocs-text-body-strong">Users</p>
      <p className="trackdocs-text-helper mt-1">
        ตรวจสอบ role, customerId และ customerCode ให้ตรงกับ Firestore ก่อนบันทึกทุกครั้ง
      </p>
    </div>
  )

  if (loading) {
    return (
      <AppShell title="Users" subtitle="Manage identities and role access." actions={pageActions}>
        <LoadingState />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Users" subtitle="Manage identities and role access." actions={pageActions}>
        <ErrorState message={error} />
      </AppShell>
    )
  }

  const formTitle = 'Edit user'
  const formDescription = 'แก้ไขสิทธิ์และข้อมูลประจำตัวของผู้ใช้งาน'
  const confirmTitle = 'ยืนยันบันทึกผู้ใช้งาน'
  const confirmDescription = `${draft.displayName.trim() || '--'} • ${draft.email || '--'} • role ${draft.role}`

  return (
    <AppShell title="Users" subtitle="Manage identities and role access." actions={pageActions}>
      <div className="trackdocs-page-entrance space-y-6">
        <div className="trackdocs-stagger-list grid gap-4 lg:hidden">
          {sortedUsers.map((user) => (
            <div key={user.uid} className="trackdocs-card trackdocs-card-strong trackdocs-card-module flex min-h-[310px] flex-col p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
                    <span className="trackdocs-card-badge-dot" aria-hidden="true" />
                    USER
                  </span>
                  <div>
                    <p className="trackdocs-text-page-title">{user.displayName}</p>
                    <p className="mt-1 trackdocs-text-body text-[var(--td-text-muted)]">{user.email}</p>
                  </div>
                </div>
                <Button tone="slate" className="rounded-[20px] px-4 py-2 trackdocs-text-badge" onClick={() => openEdit(user)}>
                  Edit
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={user.isActive ? 'ACTIVE' : 'INACTIVE'} tone={user.isActive ? 'green' : 'red'} />
                <span className="trackdocs-pill px-3 py-1 trackdocs-text-badge">
                  {user.role}
                </span>
              </div>
              <div className="trackdocs-card-divider mt-4 pt-4" />
              <div className="mt-4 space-y-1 trackdocs-text-body text-[var(--td-text-muted)]">
                <p>Customer ID: {user.customerId ?? '--'}</p>
                <p>Customer Code: {user.customerCode ?? '--'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-card-module hidden overflow-hidden lg:block">
          <table className="min-w-full divide-y divide-[rgba(17,17,17,0.08)]">
            <thead className="bg-[rgba(249,247,241,0.96)]">
              <tr>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  User
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Role
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Customer ID
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Customer Code
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Status
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(17,17,17,0.08)]">
              {sortedUsers.map((user) => (
                <tr key={user.uid} className="transition hover:bg-[rgba(248,246,239,0.92)]">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-[var(--td-text-strong)]">{user.displayName}</p>
                      <p className="trackdocs-text-helper mt-1">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)] uppercase tracking-[0.16em]">
                    {user.role}
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{user.customerId ?? '--'}</td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{user.customerCode ?? '--'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      tone={user.isActive ? 'green' : 'red'}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Button tone="slate" className="px-4 py-2 trackdocs-text-badge" onClick={() => openEdit(user)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        title={formTitle}
        description={formDescription}
        onClose={closeForm}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button tone="slate" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button tone="cyan" onClick={handleReview} disabled={saving}>
              Review changes
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Display name"
            value={draft.displayName}
            onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="TrackDocs Admin"
            hint="ชื่อที่แสดงในระบบ"
            error={draftError && !draft.displayName.trim() ? draftError : undefined}
            containerClassName="md:col-span-2"
          />
          <Input
            label="Email"
            value={draft.email}
            disabled
            placeholder="admin@trackdocs.com"
            hint="อ่านอย่างเดียว ปรับจาก Firebase Authentication"
            containerClassName="md:col-span-2"
          />
          <Select
            label="Role"
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as UserRole }))}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={draft.isActive ? 'true' : 'false'}
            onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.value === 'true' }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Select
            label="Customer ID"
            value={draft.customerId}
            onChange={(event) => handleCustomerIdChange(event.target.value)}
            hint="ถ้าเป็น customer แนะนำให้เลือกจากรายชื่อบริษัท"
          >
            <option value="">-- Select customer --</option>
            {customers.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                {customer.customerId} - {customer.companyName}
              </option>
            ))}
          </Select>
          <Input
            label="Customer code"
            value={draft.customerCode}
            onChange={(event) => setDraft((current) => ({ ...current, customerCode: event.target.value }))}
            placeholder="SMS"
            hint="ใช้กับ tracking number และหน้าลูกค้า"
            error={draftError && draft.role === 'customer' && !draft.customerCode.trim() ? draftError : undefined}
          />
          {draftError ? <p className="md:col-span-2 text-sm font-semibold text-[#c94040]">{draftError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Save"
        cancelLabel="Back"
        onConfirm={() => void handleConfirmSave()}
        onCancel={() => setConfirmOpen(false)}
        loading={saving}
      />
    </AppShell>
  )
}


