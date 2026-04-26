'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'
import { PHONE_MAX_LENGTH, PHONE_REGEX } from '@/lib/phoneValidation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const customerSchema = z.object({
  customerType: z.enum(['FRANCHISEE', 'RESIDENTIAL', 'COMMERCIAL', 'PARTNER']),
  // Common fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || EMAIL_REGEX.test(val.trim()), { message: 'Please enter a valid email address' }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= PHONE_MAX_LENGTH, {
      message: `Phone number cannot exceed ${PHONE_MAX_LENGTH} characters`,
    })
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Phone number can only contain digits, spaces, +, -, (), or .',
    }),
  mobile: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= PHONE_MAX_LENGTH, {
      message: `Mobile number cannot exceed ${PHONE_MAX_LENGTH} characters`,
    })
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Mobile number can only contain digits, spaces, +, -, (), or .',
    }),
  address: z.string().optional(),
  street: z.string().optional(),
  town: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postcode: z.string().optional(),
  // Company fields
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phoneExtension: z.string().optional(),
  website: z.string().optional(),
  companyType: z.enum(['MEDICAL_OFFICE', 'DENTAL_OFFICE', 'CORPORATE_OFFICE', 'BUSINESS_OFFICE', 'RESTAURANT', 'OTHER']).optional(),
  // Franchisee fields
  ownerName: z.string().optional(),
  storeNumber: z.string().optional(),
  shippingAddress: z.string().optional(),
  // Partner fields
  partnerType: z.enum(['DESIGNER', 'BUILDER', 'CONTRACTOR', 'DEALER']).optional(),
  // Lead fields
  leadSource: z.enum(['META', 'GOOGLE', 'REFERRAL', 'PARTNER_REFERRAL', 'DOOR_HANGER', 'DOOR_TO_DOOR', 'LINKEDIN', 'VEHICLE', 'WALK_IN', 'OTHER_PAID', 'OTHER_ORGANIC']).optional(),
  leadSourceDetail: z.string().optional(),
  referredById: z.string().optional(),
  // Other
  numberOfWindows: z.number().optional(),
  numberOfOpenings: z.number().optional(),
  productsOfInterest: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Delivery type
  deliveryType: z.enum(['DELIVERY_INSTALLATION', 'SHIPMENT', 'PICK_UP']).optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

const leadSources = [
  { value: 'META', label: 'Meta (Facebook/Instagram)' },
  { value: 'GOOGLE', label: 'Google Ads' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'PARTNER_REFERRAL', label: 'Partner Referral' },
  { value: 'DOOR_HANGER', label: 'Door Hanger' },
  { value: 'DOOR_TO_DOOR', label: 'Door to Door' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'OTHER_PAID', label: 'Other Paid' },
  { value: 'OTHER_ORGANIC', label: 'Other Organic' },
]

const products = [
  'Roller Shades',
  'Zebra Blinds',
  'Shutters',
  'Drapes',
  'Roman Shades',
  'Vertical Blinds',
  'Horizontal Blinds',
  'Motorized Shades',
]

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void
  initialData?: Partial<CustomerFormData>
  mode?: 'create' | 'edit'
}

export function CustomerForm({ onSubmit, initialData, mode = 'create' }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: 'RESIDENTIAL',
      productsOfInterest: [],
      ...initialData,
    },
  })

  const customerType = form.watch('customerType')
  const leadSource = form.watch('leadSource')

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Customer Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Type</CardTitle>
            <CardDescription>
              Select the type of customer to show relevant fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4 md:grid-cols-4"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem value="RESIDENTIAL" id="RESIDENTIAL" />
                        <Label htmlFor="RESIDENTIAL" className="cursor-pointer">Residential</Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem value="COMMERCIAL" id="COMMERCIAL" />
                        <Label htmlFor="COMMERCIAL" className="cursor-pointer">Commercial</Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem value="FRANCHISEE" id="FRANCHISEE" />
                        <Label htmlFor="FRANCHISEE" className="cursor-pointer">Franchisee</Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                        <RadioGroupItem value="PARTNER" id="PARTNER" />
                        <Label htmlFor="PARTNER" className="cursor-pointer">Partner</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Residential Fields */}
            {customerType === 'RESIDENTIAL' && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Company Fields */}
            {(customerType === 'COMMERCIAL' || customerType === 'FRANCHISEE' || customerType === 'PARTNER') && (
              <>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {customerType !== 'FRANCHISEE' && (
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Franchisee Specific */}
            {customerType === 'FRANCHISEE' && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AS-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Partner Type */}
            {customerType === 'PARTNER' && (
              <FormField
                control={form.control}
                name="partnerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select partner type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DESIGNER">Designer</SelectItem>
                        <SelectItem value="BUILDER">Builder</SelectItem>
                        <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                        <SelectItem value="DEALER">Dealer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Commercial Company Type */}
            {customerType === 'COMMERCIAL' && (
              <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MEDICAL_OFFICE">Medical Office</SelectItem>
                        <SelectItem value="DENTAL_OFFICE">Dental Office</SelectItem>
                        <SelectItem value="CORPORATE_OFFICE">Corporate Office</SelectItem>
                        <SelectItem value="BUSINESS_OFFICE">Business Office</SelectItem>
                        <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Contact & Address - aligned with quote customer information */}
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Contact &amp; Address</FormLabel>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="Mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onSelect={(sel: AddressSelection) => {
                            form.setValue('street', sel.street || sel.fullAddress)
                            form.setValue('city', sel.city)
                            form.setValue('town', sel.state)
                            form.setValue('postcode', sel.postalCode)
                            form.setValue('country', sel.country)
                          }}
                          placeholder="Start typing a street address…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town</FormLabel>
                      <FormControl>
                        <Input placeholder="Town" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode / Zip</FormLabel>
                      <FormControl>
                        <Input placeholder="Postcode or Zip code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Source */}
        {customerType !== 'FRANCHISEE' && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(leadSource === 'REFERRAL' || leadSource === 'PARTNER_REFERRAL') && (
                <FormField
                  control={form.control}
                  name="leadSourceDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of referrer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="numberOfWindows"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Windows</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of windows" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 51 }, (_, i) => i).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfOpenings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Openings</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of openings" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 51 }, (_, i) => i).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="productsOfInterest"
                render={() => (
                  <FormItem>
                    <FormLabel>Products of Interest</FormLabel>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {products.map((product) => (
                        <FormField
                          key={product}
                          control={form.control}
                          name="productsOfInterest"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(product)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, product])
                                    } else {
                                      field.onChange(current.filter((v) => v !== product))
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {product}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Delivery Type */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Type</CardTitle>
            <CardDescription>
              Select how orders will be delivered for this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="deliveryType"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DELIVERY_INSTALLATION">Delivery/Installation</SelectItem>
                      <SelectItem value="SHIPMENT">Shipment</SelectItem>
                      <SelectItem value="PICK_UP">Pick Up</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines the type of note generated for this customer's orders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this customer..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            {mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

