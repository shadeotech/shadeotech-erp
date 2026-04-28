import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CompanySettings from '@/lib/models/CompanySettings'
import { verifyAuth } from '@/lib/auth'
import User from '@/lib/models/User'
import { normalizeStoredContractTemplates } from '@/lib/contract-templates'

const DOC_ID = 'company'

async function getAuthUser(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return null
  await connectDB()
  const raw = await User.findById(auth.userId).select('role').lean()
  if (!raw || (raw.role !== 'ADMIN' && raw.role !== 'STAFF'))
    return null
  return auth
}

const DEFAULT_ADDRESS = '3235 Skylane Dr. Unit 111, Carrollton, TX 75006'

/** GET - Fetch company settings (e.g. Shadeotech address for commute). Public read for calendar/customer commute. */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const doc = await CompanySettings.findById(DOC_ID).lean()
    const companyAddress = (doc as any)?.companyAddress || DEFAULT_ADDRESS
    const contractTemplates = normalizeStoredContractTemplates((doc as any)?.contractTemplates)
    const invoiceTemplateConfig = (doc as any)?.invoiceTemplateConfig ?? null
    const invoiceReminderConfig = (doc as any)?.invoiceReminderConfig ?? { enabled: false, frequencyDays: 3, maxReminders: 5 }
    const manufacturingVideoUrl = (doc as any)?.manufacturingVideoUrl ?? ''
    const faqs = (doc as any)?.faqs ?? []
    const ticketSubjects = (doc as any)?.ticketSubjects ?? []
    const productCategories = (doc as any)?.productCategories ?? []
    return NextResponse.json({ companyAddress, contractTemplates, invoiceTemplateConfig, invoiceReminderConfig, manufacturingVideoUrl, faqs, ticketSubjects, productCategories }, { status: 200 })
  } catch (error) {
    console.error('Company settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PATCH - Update company settings. Admin/Staff only. */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { companyAddress, contractTemplates, invoiceTemplateConfig, invoiceReminderConfig, manufacturingVideoUrl, faqs, ticketSubjects, productCategories } = body

    const update: Record<string, unknown> = {}
    if (typeof companyAddress === 'string') {
      update.companyAddress = companyAddress.trim()
    }
    if (contractTemplates !== undefined) {
      const normalizedTemplates = normalizeStoredContractTemplates(contractTemplates)
      if (!normalizedTemplates) {
        return NextResponse.json({ error: 'Invalid contractTemplates payload' }, { status: 400 })
      }
      update.contractTemplates = normalizedTemplates
    }
    if (invoiceTemplateConfig !== undefined && invoiceTemplateConfig !== null && typeof invoiceTemplateConfig === 'object') {
      update.invoiceTemplateConfig = invoiceTemplateConfig
    }
    if (invoiceReminderConfig !== undefined && invoiceReminderConfig !== null && typeof invoiceReminderConfig === 'object') {
      update.invoiceReminderConfig = {
        enabled: Boolean(invoiceReminderConfig.enabled),
        frequencyDays: Number(invoiceReminderConfig.frequencyDays) || 3,
        maxReminders: Number(invoiceReminderConfig.maxReminders) || 5,
        emailSubject: invoiceReminderConfig.emailSubject?.trim() || undefined,
        emailMessage: invoiceReminderConfig.emailMessage?.trim() || undefined,
      }
    }
    if (typeof manufacturingVideoUrl === 'string') {
      update.manufacturingVideoUrl = manufacturingVideoUrl.trim()
    }
    if (Array.isArray(faqs)) {
      update.faqs = faqs.filter((f: any) => f.question?.trim() && f.answer?.trim())
    }
    if (Array.isArray(ticketSubjects)) {
      update.ticketSubjects = ticketSubjects.filter((s: any) => typeof s === 'string' && s.trim()).map((s: string) => s.trim())
    }
    if (Array.isArray(productCategories)) {
      update.productCategories = productCategories.filter((s: any) => typeof s === 'string' && s.trim()).map((s: string) => s.trim())
    }

    const toResponse = (d: any) => ({
      companyAddress: d?.companyAddress || DEFAULT_ADDRESS,
      contractTemplates: normalizeStoredContractTemplates(d?.contractTemplates),
      invoiceTemplateConfig: d?.invoiceTemplateConfig ?? null,
      invoiceReminderConfig: d?.invoiceReminderConfig ?? { enabled: false, frequencyDays: 3, maxReminders: 5 },
      manufacturingVideoUrl: d?.manufacturingVideoUrl ?? '',
      faqs: d?.faqs ?? [],
      ticketSubjects: d?.ticketSubjects ?? [],
      productCategories: d?.productCategories ?? [],
    })

    if (Object.keys(update).length === 0) {
      const doc = await CompanySettings.findById(DOC_ID).lean()
      return NextResponse.json(toResponse(doc), { status: 200 })
    }

    const doc = await CompanySettings.findByIdAndUpdate(
      DOC_ID,
      { $set: update },
      { new: true, upsert: true }
    ).lean()

    return NextResponse.json(toResponse(doc), { status: 200 })
  } catch (error) {
    console.error('Company settings PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
