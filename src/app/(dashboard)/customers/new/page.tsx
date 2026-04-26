'use client'

import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/customers/CustomerForm'

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSubmit = (data: any) => {
    console.log('Creating customer:', data)
    // Will connect to API later
    router.push('/customers')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-medium">Add New Customer</h2>
        <p className="text-sm text-muted-foreground">
          Create a new customer, lead, or partner record
        </p>
      </div>

      <CustomerForm onSubmit={handleSubmit} mode="create" />
    </div>
  )
}

