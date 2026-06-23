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
import { createCustomer, listCustomers, updateCustomer } from '../../lib/firestore'
import type { Customer } from '../../types'

type CustomerDraft = {
  customerId: string
  companyName: string
  companyCode: string
  isActive: boolean
}

const emptyDraft: CustomerDraft = {
  customerId: '',
  companyName: '',
  companyCode: '',
  isActive: true,
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft)
  const [draftError, setDraftError] = useState('')

  const loadCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const items = await listCustomers()
      setCustomers(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [])

  const sortedCustomers = useMemo(
    () => [...customers].sort((left, right) => left.companyName.localeCompare(right.companyName)),
    [customers],
  )

  const openCreate = () => {
    setMode('create')
    setDraft(emptyDraft)
    setDraftError('')
    setFormOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setMode('edit')
    setDraft({
      customerId: customer.customerId,
      companyName: customer.companyName,
      companyCode: customer.companyCode,
      isActive: customer.isActive,
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
    setDraftError('')
    setDraft(emptyDraft)
  }

  const validateDraft = () => {
    const customerId = draft.customerId.trim()
    const companyName = draft.companyName.trim()
    const companyCode = draft.companyCode.trim()

    if (!customerId || !companyName || !companyCode) {
      setDraftError('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน')
      return false
    }

    if (mode === 'create' && customers.some((customer) => customer.customerId === customerId)) {
      setDraftError('Customer ID นี้มีอยู่แล้ว กรุณาใช้รหัสใหม่')
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

    const customerId = draft.customerId.trim()
    const payload = {
      companyName: draft.companyName.trim(),
      companyCode: draft.companyCode.trim(),
      isActive: draft.isActive,
    }

    setSaving(true)
    try {
      if (mode === 'create') {
        await createCustomer(customerId, payload)
        toast.success('สร้าง customer เรียบร้อยแล้ว')
      } else {
        await updateCustomer(customerId, payload)
        toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว')
      }

      setConfirmOpen(false)
      setFormOpen(false)
      setDraft(emptyDraft)
      await loadCustomers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setSaving(false)
    }
  }

  const pageActions = (
    <>
      <div>
        <p className="trackdocs-text-body-strong">Customers</p>
        <p className="trackdocs-text-helper mt-1">
          Customer ID เป็นตัวระบุตัวตนหลักของบริษัท แก้ชื่อและ code ได้ แต่ควรยืนยันก่อนบันทึกทุกครั้ง
        </p>
      </div>
      <Button tone="cyan" onClick={openCreate}>
        + Add customer
      </Button>
    </>
  )

  if (loading) {
    return (
      <AppShell title="Customers" subtitle="Manage company records and access boundaries." actions={pageActions}>
        <LoadingState />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Customers" subtitle="Manage company records and access boundaries." actions={pageActions}>
        <ErrorState message={error} />
      </AppShell>
    )
  }

  const formTitle = mode === 'create' ? 'Add customer' : 'Edit customer'
  const formDescription =
    mode === 'create'
      ? 'สร้าง company record ใหม่ด้วย Customer ID ที่ไม่ซ้ำ'
      : 'แก้ไขข้อมูลบริษัทเดิมอย่างระมัดระวัง'
  const confirmTitle = mode === 'create' ? 'ยืนยันสร้าง customer' : 'ยืนยันบันทึกการแก้ไข'
  const confirmDescription =
    mode === 'create'
      ? `Customer ID: ${draft.customerId.trim() || '--'} • ${draft.companyName.trim() || '--'}`
      : `Customer ID: ${draft.customerId.trim() || '--'} • ${draft.companyName.trim() || '--'}`

  return (
    <AppShell title="Customers" subtitle="Manage company records and access boundaries." actions={pageActions}>
      <div className="trackdocs-page-entrance space-y-6">
        <div className="trackdocs-stagger-list grid gap-4 lg:hidden">
          {sortedCustomers.map((customer) => (
            <div key={customer.customerId} className="trackdocs-card trackdocs-card-strong trackdocs-card-module flex min-h-[300px] flex-col p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="trackdocs-card-badge px-3 py-1.5 text-[var(--td-text-muted)]">
                    <span className="trackdocs-card-badge-dot" aria-hidden="true" />
                    CUSTOMER
                  </span>
                  <div>
                    <p className="trackdocs-text-badge text-[var(--td-text-muted)]">
                      {customer.customerId}
                    </p>
                    <p className="mt-2 trackdocs-text-page-title">
                      {customer.companyName}
                    </p>
                  </div>
                </div>
                <Button tone="slate" className="rounded-[20px] px-4 py-2 trackdocs-text-badge" onClick={() => openEdit(customer)}>
                  Edit
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={customer.isActive ? 'ACTIVE' : 'INACTIVE'} tone={customer.isActive ? 'green' : 'red'} />
                <span className="trackdocs-pill px-3 py-1 trackdocs-text-badge">{customer.companyCode}</span>
              </div>
              <div className="trackdocs-card-divider mt-4 pt-4" />
              <p className="mt-4 trackdocs-text-body text-[var(--td-text-muted)]">
                Updated {formatDateTime(customer.updatedAt)}
              </p>
            </div>
          ))}
        </div>

        <div className="trackdocs-entrance trackdocs-card trackdocs-card-strong trackdocs-card-module hidden overflow-hidden lg:block">
          <table className="min-w-full divide-y divide-[rgba(17,17,17,0.08)]">
            <thead className="bg-[rgba(249,247,241,0.96)]">
              <tr>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Customer ID
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Company
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Code
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Status
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Updated
                </th>
                <th className="px-5 py-4 text-left trackdocs-text-badge text-[var(--td-text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(17,17,17,0.08)]">
              {sortedCustomers.map((customer) => (
                <tr key={customer.customerId} className="transition hover:bg-[rgba(248,246,239,0.92)]">
                  <td className="px-5 py-4 trackdocs-text-body-strong">{customer.customerId}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-[var(--td-text-strong)]">{customer.companyName}</p>
                      <p className="trackdocs-text-helper mt-1">Document owner</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{customer.companyCode}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={customer.isActive ? 'ACTIVE' : 'INACTIVE'}
                      tone={customer.isActive ? 'green' : 'red'}
                    />
                  </td>
                  <td className="px-5 py-4 trackdocs-text-body text-[var(--td-text-muted)]">{formatDateTime(customer.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <Button tone="slate" className="px-4 py-2 text-xs" onClick={() => openEdit(customer)}>
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
            label="Customer ID"
            value={draft.customerId}
            onChange={(event) => setDraft((current) => ({ ...current, customerId: event.target.value }))}
            disabled={mode === 'edit'}
            placeholder="SMS"
            hint="ใช้เป็น ID หลักของเอกสารและโปรไฟล์ผู้ใช้"
            error={draftError && !draft.customerId.trim() ? draftError : undefined}
            containerClassName="md:col-span-1"
          />
          <Select
            label="Status"
            value={draft.isActive ? 'true' : 'false'}
            onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.value === 'true' }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Input
            label="Company name"
            value={draft.companyName}
            onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))}
            placeholder="Siam Marine Services"
            hint="ชื่อบริษัทที่จะแสดงใน dashboard"
            error={draftError && !draft.companyName.trim() ? draftError : undefined}
            containerClassName="md:col-span-2"
          />
          <Input
            label="Company code"
            value={draft.companyCode}
            onChange={(event) => setDraft((current) => ({ ...current, companyCode: event.target.value }))}
            placeholder="SMS"
            hint="ใช้สำหรับ tracking number และการเชื่อมต่อ user"
            error={draftError && !draft.companyCode.trim() ? draftError : undefined}
            containerClassName="md:col-span-2"
          />
          {draftError ? <p className="md:col-span-2 text-sm font-semibold text-[#c94040]">{draftError}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={mode === 'create' ? 'Create' : 'Save'}
        cancelLabel="Back"
        onConfirm={() => void handleConfirmSave()}
        onCancel={() => setConfirmOpen(false)}
        loading={saving}
      />
    </AppShell>
  )
}

function formatDateTime(value: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


