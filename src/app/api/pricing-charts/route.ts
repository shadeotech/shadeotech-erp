import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import PricingChart from '@/lib/models/PricingChart'
import { verifyAuth } from '@/lib/auth'
import type { User as UserType } from '@/types/database'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

function toApiPricingChart(doc: any) {
  // Ensure prices are properly formatted (handle Mongoose Mixed type conversion)
  const formatPrices = (prices: any): Record<string, Record<string, number>> => {
    if (!prices) return {}
    // If it's already an object, return as is
    if (typeof prices === 'object' && !Array.isArray(prices)) {
      const formatted: Record<string, Record<string, number>> = {}
      Object.keys(prices).forEach(key => {
        if (typeof prices[key] === 'object' && !Array.isArray(prices[key])) {
          formatted[key] = prices[key]
        }
      })
      return formatted
    }
    return {}
  }

  return {
    collectionId: doc.collectionId,
    collectionName: doc.collectionName,
    subCharts: doc.subCharts ? doc.subCharts.map((sc: any) => ({
      ...sc,
      mainTable: {
        ...sc.mainTable,
        prices: formatPrices(sc.mainTable?.prices),
      },
      cassetteTable: sc.cassetteTable ? {
        ...sc.cassetteTable,
        prices: formatPrices(sc.cassetteTable?.prices),
      } : undefined,
    })) : undefined,
    mainTable: {
      ...doc.mainTable,
      prices: formatPrices(doc.mainTable?.prices),
    },
    cassetteTable: doc.cassetteTable ? {
      ...doc.cassetteTable,
      prices: formatPrices(doc.cassetteTable?.prices),
    } : undefined,
    notes: doc.notes || { mainTableNote: '', cassetteTableNote: '' },
    fabrics: doc.fabrics || [],
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

// GET - Fetch all pricing charts
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and STAFF can view pricing charts
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const charts = await PricingChart.find({}).sort({ collectionName: 1 }).lean()

    // Convert to Record format
    const chartsRecord: Record<string, any> = {}
    charts.forEach((chart) => {
      chartsRecord[chart.collectionId] = toApiPricingChart(chart)
    })

    return NextResponse.json({ charts: chartsRecord })
  } catch (error: any) {
    console.error('Pricing Charts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Save all pricing charts (upsert)
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can save pricing charts
    if (!auth.user || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { charts } = body

    if (!charts || typeof charts !== 'object') {
      return NextResponse.json(
        { error: 'Invalid charts data' },
        { status: 400 }
      )
    }

    // Upsert each chart
    const operations = Object.keys(charts).map((collectionId) => {
      const chart = charts[collectionId]
      return {
        updateOne: {
          filter: { collectionId },
          update: {
            $set: {
              collectionId,
              collectionName: chart.collectionName,
              subCharts: chart.subCharts || [],
              mainTable: chart.mainTable,
              cassetteTable: chart.cassetteTable || undefined,
              notes: chart.notes || { mainTableNote: '', cassetteTableNote: '' },
              fabrics: chart.fabrics || [],
            },
          },
          upsert: true,
        },
      }
    })

    await PricingChart.bulkWrite(operations)

    // Fetch updated charts
    const updatedCharts = await PricingChart.find({}).sort({ collectionName: 1 }).lean()
    const chartsRecord: Record<string, any> = {}
    updatedCharts.forEach((chart) => {
      chartsRecord[chart.collectionId] = toApiPricingChart(chart)
    })

    return NextResponse.json({ charts: chartsRecord })
  } catch (error: any) {
    console.error('Pricing Charts PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
