'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Users,
  Shield,
  FileText,
  FileCheck,
  Save,
  X,
  Check,
  BookOpen,
  Wrench,
  Video,
  Loader2,
  ClipboardList,
  MapPin,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useQuotesStore } from '@/stores/quotesStore'
import { ProductCollectionPricingCharts } from '@/components/pricing/ProductCollectionPricingCharts'
import { ProductionSheetsSettings } from '@/components/production/ProductionSheetsSettings'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import {
  normalizeStoredContractTemplates,
  settingsContentsToStored,
  storedToSettingsContents,
} from '@/lib/contract-templates'
import { InvoiceCustomizerPanel } from '@/components/invoices/InvoiceCustomizerPanel'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { useInvoiceTemplateStore } from '@/stores/invoiceTemplateStore'
import { sanitizePhoneInput, validatePhone } from '@/lib/phoneValidation'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'
import { QuoteOptionsSettings } from '@/components/settings/QuoteOptionsSettings'

const mockProducts = [
  {
    id: 'prod_1',
    name: 'Roller Shades',
    category: 'roller_shades',
    description: 'Standard roller shades with various fabric options',
    basePrice: 150,
    isActive: true,
  },
  {
    id: 'prod_2',
    name: 'Zebra Blinds',
    category: 'zebra_blinds',
    description: 'Zebra blinds with alternating light and privacy bands',
    basePrice: 180,
    isActive: true,
  },
  {
    id: 'prod_3',
    name: 'Shutters',
    category: 'shutters',
    description: 'Custom window shutters',
    basePrice: 220,
    isActive: true,
  },
  {
    id: 'prod_4',
    name: 'Roman Shades',
    category: 'roman_shades',
    description: 'Elegant roman shades with soft folds',
    basePrice: 200,
    isActive: true,
  },
]

interface UserData {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  permissions?: Record<string, string>;
}

const PERM_CATEGORIES = [
  { id: 'sales', name: 'Sales' },
  { id: 'production', name: 'Production' },
  { id: 'contacts', name: 'Contacts' },
  { id: 'calendar', name: 'Calendar' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'leads', name: 'Leads' },
  { id: 'tickets', name: 'Tickets' },
  { id: 'reports', name: 'Reports' },
  { id: 'accounting', name: 'Accounting' },
  { id: 'delivery', name: 'Delivery' },
]
const PERM_LEVELS = ['no', 'read', 'edit', 'full'] as const
type PermLevel = typeof PERM_LEVELS[number]

const contractTemplates = [
  { id: 'contract_1', name: 'Interior Shades', type: 'INTERIOR' },
  { id: 'contract_2', name: 'Exterior Shades', type: 'EXTERIOR' },
  { id: 'contract_3', name: 'Interior & Exterior Shades', type: 'INTERIOR_AND_EXTERIOR' },
]

const DEFAULT_CONTRACT_CONTENTS: Record<string, string> = {
  contract_1: `Thank You for Choosing Shadeotech!
We truly appreciate your business and the opportunity to serve you. At Shadeotech, we believe in transparency, we hate surprises as much as you do. Please take a moment to carefully review the following agreement to ensure everything goes smoothly with your project. Please review the estimate thoroughly to ensure the accuracy of the selected fabric model number and details such as mount type, motor, window style, and cord specifications. Changes or refunds are not permitted after the order has been approved and placed. The client acknowledges that they have thoroughly reviewed the quote and confirmed that all information is correct. Any modifications requested after order approval must be submitted in writing and may require a revised invoice, updated timeline, and additional charges.

Payment Terms To initiate the manufacturing process, a down payment equal to fifty percent (50%) of the total purchase price is required. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products. Payments can be made via check, Zelle transfer, or credit card. Payments via check should be made out to "SHADEOTECH." Zelle transfers should be directed to info@shadeotech.com. Please note that payments made by credit card will incur a surcharge of three percent (3%) of the total transaction amount. Financing will incur a ten percent (10%) charge that the financing provider charges on top of the invoice total. All sales are final and non-refundable. By placing an order, the client agrees that they have reviewed and accepted all product specifications, designs, and dimensions. SHADEOTECH is not liable for any discrepancies once the order has been confirmed by the client. The client agrees that any disputes regarding payment will be resolved amicably and in good faith between both parties. However, the client also agrees to waive their right to withhold payment or initiate a chargeback or payment dispute with their bank or credit card provider. Failure to adhere to the agreed payment terms may result in legal action to recover the outstanding balance, including any additional costs incurred by SHADEOTECH in the process of collection, including but not limited to legal fees. If a client places an order that requires multiple phases and multiple invoices, any unpaid invoices will void the warranty on all products and services provided. Additionally, no installation will occur until all balances are settled in full. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products.

I understand that my balance must be paid in full prior to the scheduled installation date. If full payment is not received before installation, a late fee of $75 per day will apply until the outstanding balance is settled. If I have proceeded with financing, I acknowledge that the financing provider operates under its own terms and conditions. I further understand that all of Shadeotech's approved financing providers apply a 10% financing fee, which is separate from and in addition to any fees or terms provided by the financing company.

Multiple Invoices For projects with multiple invoices—such as different phases for interior and exterior installations or sections broken into multiple parts—you must settle the balance for each phase before we can proceed to the next stage. We reserve the right to not proceed with subsequent phases if your previous payments were late.

Late Payment If the full payment is not made by the time of installation, a late payment fee of $75 per day will be applied starting from the date of installation until the outstanding balance is settled in full. The customer acknowledges and agrees that the company reserves the right to withhold services or delay installation until the balance is cleared. Additionally, if there is any outstanding balance after the installation is complete, the warranty will be void. If any invoice remains unpaid beyond the due date and Shadeotech is required to initiate collection efforts, the client agrees to be responsible for all costs associated with the recovery of the outstanding balance. This includes, but is not limited to, collection agency fees, attorney fees, court costs, and interest on the unpaid balance at the maximum rate permitted by Texas law. These fees will be added to the total amount due and are enforceable under this agreement.

Electrical Work Any electrical work required for the installation or operation of Shadeotech products is the sole responsibility of the client. Shadeotech does not perform electrical work and is not licensed or authorized to do so. We are not liable for any damages, malfunctions, or safety issues resulting from electrical work performed by a third-party electrician or by the client themselves. We have no control over the color of wires provided with motors or chargers, as these are standard from the manufacturer and cannot be customized. Shadeotech does not paint or alter any electrical components. If a client chooses to use an extension cord or any alternative power setup that does not involve directly plugging the shade into a standard outlet, all responsibility for performance, safety, and compliance lies with the homeowner. All costs related to third-party electrical services are the sole responsibility of the client, and Shadeotech shall not be held liable for any issues arising from such services.

Aluminum Components By default, roller shades will come with a steel beaded chain. If you prefer a white or black plastic chain, you must specify this at the time of ordering. However, we do not recommend plastic chains as they are less durable. All other shades will have color-coordinated cords. Both chains and cords are custom-cut to match the length of each window for a precise fit. By law, all chains and cords must be securely screwed to the wall for safety compliance. If you choose not to have them secured, you may sign a waiver acknowledging the risks.

Solar Panel Obstruction Policy If any obstruction (e.g., furniture, fixtures, new construction, landscaping, screens, or structural changes) appears in front of a solar panel after installation, and repositioning is required, a trip charge will apply to move the solar panel to an alternative position. Additionally, the Customer acknowledges that solar-powered motors rely entirely on adequate sunlight exposure to maintain battery charge. Shadeotech is not responsible for reduced performance or charging issues caused by insufficient sunlight, improper panel orientation, shaded window placement, weather conditions, or seasonal changes in sun intensity and angle. Shadeotech does not control the availability of sunlight or environmental conditions affecting solar charging.

Smart Hub & Timer Configuration For security reasons, Shadeotech will not program or configure any smart hubs that are connected to a customer's WiFi network. Customers are responsible for programming and managing their own smart hubs to ensure the security of their network and devices. If the client has a remote with a timer function, Shadeotech will not configure the timer. Shadeotech is not responsible for any issues, disruptions, malfunctions, or loss of functionality caused by third-party applications, firmware updates, platform outages, WiFi/router changes, or compatibility limitations. This includes, but is not limited to, apps such as Bond, Somfy, Tuya, Amazon Alexa, Google Home, Apple HomeKit, or any other external smart control system. If the Customer experiences problems related to a third-party app or smart platform, the Customer agrees that they must contact the third-party provider directly for troubleshooting and support. Shadeotech shall not be liable for service calls, reprogramming, or operational issues arising from third-party software or systems outside of Shadeotech's control.

Remote & Programming Policy If a remote is damaged, dropped, exposed to moisture, or tampered with in any way, including alterations to the programming, the product warranty will be void. This includes any instances where the client opens the shade motor housing, interferes with wiring, or attempts reprogramming without Shadeotech's guidance. Clients are advised not to make any changes to the remote settings or motor configurations after installation. Any service required to correct issues caused by such tampering will incur a trip charge starting at $125, plus the cost of repair or replacement.

Battery Maintenance Requirement The Client agrees to charge each rechargeable battery motor using the charger provided by Shadeotech at least once every six (6) months, regardless of whether the motor has been in use. This requirement is necessary to maintain optimal battery health and performance. Failure to follow this maintenance requirement may void the warranty on the motor and battery.

Timeline The delivery timeframe for your shades can range from 2 days to 8 weeks, depending on the product and fabric selected, or as indicated by your consultant. While we strive to complete deliveries within 4 weeks from acceptance of the contract and initial payment, unforeseen circumstances may occasionally lead to delays. Shadeotech shall not be held liable for delays in product delivery due to circumstances beyond its control, including but not limited to, natural disasters, transportation disruptions, or supplier delays.

Warranty We offer a limited lifetime warranty on our products, which means your warranty is valid as long as you reside in your house. Warranty registration is required on our website at https://shadeotech.com/warranty-registration/. Warranty registrations must be completed within 30 days of installation. Motors have a 5-year warranty. For any issues, contact us via phone or our website. This warranty excludes conditions from accidents, misuse, or neglect. If there is any outstanding balance after the installation is complete, the warranty will be void. If a motor is charged with any charger other than the one provided by Shadeotech, the warranty will be void due to variations in wattage that may cause damage. Warranty does not cover damage caused by extreme weather or natural events.

Trip Charge Policy A trip charge starting at $125 will apply for all service visits, including warranty claims, non-warranty repairs, or adjustments caused by factors outside of Shadeotech's control. This includes, but is not limited to, issues resulting from user error, damage, third-party interference, environmental factors, or changes to the home that affect shade operation after installation. Warranty claims still require a technician visit to evaluate and resolve the issue, and the trip charge applies in all cases. If additional site visits are required for further measurements, consultations, or confirmation beyond the initial visit, a service fee will apply per visit. This includes revisits due to client-requested changes, access issues, or site unpreparedness. The customer is responsible for obtaining any required HOA approvals or permits. Shadeotech is not liable for violations or removal requests.

High Ceiling(s) Measuring high ceiling windows is challenging. Our technicians take utmost care during measurement, but a margin of error of ±1 inches might occur. Adjustments will be made during installation if necessary.

Fabric Wrapping Disclaimer We do not recommend fabric wrapping the cassette or bottom rail. The client acknowledges that if dust or dirt gets into the crevices or if the tape wears off, it will not be covered by warranty. A replacement can be done at an additional charge.

Window Deviation and Workaround Windows may deviate slightly, with differences up to 1in. Our shades are precisely crafted; however, window deviations may cause a slight angle at the bottom. We recommend installing without spacers to minimize visibility of deviations, though spacers can be used to level the window if necessary. Shadeotech is not responsible for any inherent flaws in window construction.

Gaps Blinds and shades may have small gaps to prevent damage during operation. These gaps do not allow detailed visibility from outside but might show light and movement. For enhanced light control and privacy, you may opt to add a side channel track that gets installed on either side of the blinds or shades. The client acknowledges that walls are not always perfectly straight. Shadeotech shades are cut by a precision machine and are perfectly straight when manufactured. If any slopes or gaps appear on any side after installation, it is due to wall irregularities and not a defect in the product. Shadeotech is not responsible for any aesthetic concerns caused by wall unevenness.

Client-Provided Measurements Disclaimer: If the Customer chooses to provide their own measurements instead of having Shadeotech measure the windows, the Customer assumes full responsibility for the accuracy of all dimensions submitted for manufacturing. Shadeotech will manufacture products strictly according to the measurements provided by the Customer. Because all products are custom-made, Shadeotech is not responsible for errors, improper fit, or performance issues resulting from incorrect or incomplete measurements supplied by the Customer. If a remake, adjustment, or replacement is required due to measurement inaccuracies, the Customer agrees that all associated costs will be the Customer's responsibility. This includes, but is not limited to, remanufacturing fees, material costs, shipping, and additional service or installation charges.

Installation and Site Preparation The client is responsible for ensuring that the installation site is clear and ready for Shadeotech's employees and subcontractors to perform their work. This includes ensuring that the path to the installation area is unobstructed and that any furniture, valuables, or other items are moved out of the way prior to the scheduled installation time. Shadeotech and its employees are not permitted to move or handle any of the client's belongings. The client agrees that Shadeotech is not liable for any damages to the client's property, including but not limited to furniture, valuables, or any other items, resulting from the installation process. The client assumes full responsibility for any loss or damage that may occur due to the client's failure to adequately prepare the site. The client understands that during installation, walls, window trims, and window sills may incur damage. Shadeotech is not responsible for failures due to mounting into structurally unsound or non-standard surfaces. The client releases Shadeotech from liability, and Shadeotech is not responsible for any damage that may occur. Shadeotech shall not be liable for any damages, injuries, or losses arising from the installation, use, or operation of its products. The client assumes full responsibility for ensuring proper maintenance, use, and operation. Shadeotech makes no guarantees regarding installation in non-recommended settings and voids any warranty for installations that do not follow professional recommendations. If the client is not present for the scheduled installation, the Shadeotech team will wait for 15 minutes. After this period, the client will need to reschedule and pay an additional service charge. If blind removal is required before installation, the client acknowledges that there will be a fee for the removal and disposal.

1. Definitions "Company" refers to Shadeotech Inc. "Customer" means the purchaser of goods and/or services from the Company. "Goods" refer to all products sold, customized, and/or installed by the Company. "Terms" refer to the Terms and Conditions set forth in this agreement.

2. Cancellation & Refunds Once a deposit has been received and the order placed into production, the order is non-cancelable and non-refundable. Shadeotech reserves the right to reject any cancellation or modification request after order confirmation. If exceptions are made, additional charges may apply at Shadeotech's sole discretion.

3. Ownership & Risk Transfer Title to the Goods remains with Shadeotech until full payment is received. Risk of loss or damage to Goods passes to the Customer upon delivery or installation. Customers are responsible for safeguarding installed products from that moment forward.

4. Photo Consent for Marketing Customer acknowledges and agrees that Shadeotech may take before-and-after photographs of the installation site strictly for use in portfolio, training, and marketing purposes including social media. No personal information including names, addresses, or any identifying details will be disclosed. Customer may opt-out in writing before installation if they do not wish for photos of their property to be used.

5. Final Customization Confirmation All orders are custom-made. Once materials are approved and production begins, no changes may be made to design, fabric, mount type, or motorization. If the client is dissatisfied with their custom selection post-installation, modifications can be made for an additional charge. Shadeotech is not responsible for client remorse or preference change after manufacturing has begun.

6. Inspection Customer must inspect installed products immediately. Any issues or discrepancies must be reported to Shadeotech in writing within 24 hours of installation. After this window, all products will be deemed accepted in full working condition.

7. Force Majeure The Company shall not be liable for any failure to perform its obligations where such failure results from any cause beyond the Company's reasonable control, including but not limited to natural disasters, labor disputes, delays by suppliers, or government actions.

8. Severability If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

9. Waiver Failure by the Company to enforce any provision of these Terms shall not be construed as a waiver of any provision or right.

10. Governing Law This agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this agreement shall be subject to the exclusive jurisdiction of the courts located in Texas.

Acknowledgment By signing below, I hereby acknowledge that I have read, understood, and agree to be bound by the above terms and conditions. I also confirm that I have reviewed the quote and all the provided information is accurate and correct.

________________________________________ ___________________________________
Full Name                                  Address of Installation Site

_________________________________________ _________________________________
Signature                                  Date`,
  contract_2: `Thank You for Choosing Shadeotech!

We truly appreciate your business and the opportunity to serve you. At Shadeotech, we believe in transparency, we hate surprises as much as you do. Please take a moment to carefully review the following agreement to ensure everything goes smoothly with your project. Please review the estimate thoroughly to ensure the accuracy of the selected fabric model number and details such as mount type, motor, window style, and cord specifications. Changes or refunds are not permitted after the order has been approved and placed. The client acknowledges that they have thoroughly reviewed the quote and confirmed that all information is correct. Any modifications requested after order approval must be submitted in writing and may require a revised invoice, updated timeline, and additional charges.

Payment Terms To initiate the manufacturing process, a down payment equal to fifty percent (50%) of the total purchase price is required. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products. Payments can be made via check, Zelle transfer, or credit card. Payments via check should be made out to "SHADEOTECH." Zelle transfers should be directed to info@shadeotech.com. Please note that payments made by credit card will incur a surcharge of three percent (3%) of the total transaction amount. Financing will incur a ten percent (10%) charge that the financing provider charges on top of the invoice total. All sales are final and non-refundable. By placing an order, the client agrees that they have reviewed and accepted all product specifications, designs, and dimensions. SHADEOTECH is not liable for any discrepancies once the order has been confirmed by the client. The client agrees that any disputes regarding payment will be resolved amicably and in good faith between both parties. However, the client also agrees to waive their right to withhold payment or initiate a chargeback or payment dispute with their bank or credit card provider. Failure to adhere to the agreed payment terms may result in legal action to recover the outstanding balance, including any additional costs incurred by SHADEOTECH in the process of collection, including but not limited to legal fees. If a client places an order that requires multiple phases and multiple invoices, any unpaid invoices will void the warranty on all products and services provided. Additionally, no installation will occur until all balances are settled in full. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products.

I understand that my balance must be paid in full prior to the scheduled installation date. If full payment is not received before installation, a late fee of $75 per day will apply until the outstanding balance is settled. If I have proceeded with financing, I acknowledge that the financing provider operates under its own terms and conditions. I further understand that all of Shadeotech's approved financing providers apply a 10% financing fee, which is separate from and in addition to any fees or terms provided by the financing company.

Multiple Invoices For projects with multiple invoices—such as different phases for interior and exterior installations or sections broken into multiple parts—you must settle the balance for each phase before we can proceed to the next stage. We reserve the right to not proceed with subsequent phases if your previous payments were late.

Late Payment If the full payment is not made by the time of installation, a late payment fee of $75 per day will be applied starting from the date of installation until the outstanding balance is settled in full. The customer acknowledges and agrees that the company reserves the right to withhold services or delay installation until the balance is cleared. Additionally, if there is any outstanding balance after the installation is complete, the warranty will be void. If any invoice remains unpaid beyond the due date and Shadeotech is required to initiate collection efforts, the client agrees to be responsible for all costs associated with the recovery of the outstanding balance. This includes, but is not limited to, collection agency fees, attorney fees, court costs, and interest on the unpaid balance at the maximum rate permitted by Texas law. These fees will be added to the total amount due and are enforceable under this agreement.

Electrical Work Any electrical work required for the installation or operation of Shadeotech products is the sole responsibility of the client. Shadeotech does not perform electrical work and is not licensed or authorized to do so. We are not liable for any damages, malfunctions, or safety issues resulting from electrical work performed by a third-party electrician or by the client themselves. We have no control over the color of wires provided with motors or chargers, as these are standard from the manufacturer and cannot be customized. Shadeotech does not paint or alter any electrical components. If a client chooses to use an extension cord or any alternative power setup that does not involve directly plugging the shade into a standard outlet, all responsibility for performance, safety, and compliance lies with the homeowner. All costs related to third-party electrical services are the sole responsibility of the client, and Shadeotech shall not be held liable for any issues arising from such services.

Aluminum Components By default, all components will be color-coordinated with the closest available color to the selected fabric. If a specific color is desired, it must be specified at the time of consultation. Once an order has been placed, we are unable to make any changes.

Solar Panel Obstruction Policy If any obstruction (e.g., furniture, fixtures, new construction, landscaping, screens, or structural changes) appears in front of a solar panel after installation, and repositioning is required, a trip charge will apply to move the solar panel to an alternative position. Additionally, the Customer acknowledges that solar-powered motors rely entirely on adequate sunlight exposure to maintain battery charge. Shadeotech is not responsible for reduced performance or charging issues caused by insufficient sunlight, improper panel orientation, shaded window placement, weather conditions, or seasonal changes in sun intensity and angle. Shadeotech does not control the availability of sunlight or environmental conditions affecting solar charging.

Exterior Shades Exterior shades require a flat surface for the track to be installed. If the surface has stonework, Shadeotech may need to shave or fill gaps with foam for proper installation. Shadeotech is not responsible for any resulting aesthetic issues or modifications required to accommodate installation. Patios are often sloped for drainage purposes; as a result, Shadeotech is not responsible if the bottom of the shade does not provide complete coverage. If an exterior shade is installed in a way that deviates from Shadeotech's professional recommendations, or if exterior shades are left down during extreme weather conditions, such as high winds, freezing rain, hail, or any weather conditions that trigger official weather alerts, and the zipper or other components become damaged, SHADEOTECH will not be responsible, and the warranty will not cover the repairs or replacements. Shadeotech is not responsible for any resulting issues, including but not limited to shade malfunction, improper function, or detachment. Any warranty for such installations will be void.

Smart Hub & Timer Configuration For security reasons, Shadeotech will not program or configure any smart hubs that are connected to a customer's WiFi network. Customers are responsible for programming and managing their own smart hubs to ensure the security of their network and devices. If the client has a remote with a timer function, Shadeotech will not configure the timer. Shadeotech is not responsible for any issues, disruptions, malfunctions, or loss of functionality caused by third-party applications, firmware updates, platform outages, WiFi/router changes, or compatibility limitations. This includes, but is not limited to, apps such as Bond, Somfy, Tuya, Amazon Alexa, Google Home, Apple HomeKit, or any other external smart control system. If the Customer experiences problems related to a third-party app or smart platform, the Customer agrees that they must contact the third-party provider directly for troubleshooting and support. Shadeotech shall not be liable for service calls, reprogramming, or operational issues arising from third-party software or systems outside of Shadeotech's control.

Remote & Programming Policy If a remote is damaged, dropped, exposed to moisture, or tampered with in any way, including alterations to the programming, the product warranty will be void. This includes any instances where the client opens the shade motor housing, interferes with wiring, or attempts reprogramming without Shadeotech's guidance. Clients are advised not to make any changes to the remote settings or motor configurations after installation. Any service required to correct issues caused by such tampering will incur a trip charge starting at $125, plus the cost of repair or replacement.

Timeline The delivery timeframe for your shades can range from 2 days to 8 weeks, depending on the product and fabric selected, or as indicated by your consultant. While we strive to complete deliveries within 4 weeks from acceptance of the contract and initial payment, unforeseen circumstances may occasionally lead to delays. Shadeotech shall not be held liable for delays in product delivery due to circumstances beyond its control, including but not limited to, natural disasters, transportation disruptions, or supplier delays.

Warranty We offer a limited lifetime warranty on our products, which means your warranty is valid as long as you reside in your house. Warranty registration is required on our website at https://shadeotech.com/warranty-registration/. Warranty registrations must be completed within 30 days of installation. Motors have a 5-year warranty, and the exterior Zip-Track has its own warranty. For any issues, contact us via phone or our website. This warranty excludes conditions from accidents, misuse, or neglect. If there is any outstanding balance after the installation is complete, the warranty will be void. If a motor is charged with any charger other than the one provided by Shadeotech, the warranty will be void due to variations in wattage that may cause damage. Warranty does not cover damage caused by extreme weather or natural events.

Trip Charge Policy A trip charge starting at $125 will apply for all service visits, including warranty claims, non-warranty repairs, or adjustments caused by factors outside of Shadeotech's control. This includes, but is not limited to, issues resulting from user error, damage, third-party interference, environmental factors, or changes to the home that affect shade operation after installation. Warranty claims still require a technician visit to evaluate and resolve the issue, and the trip charge applies in all cases. If additional site visits are required for further measurements, consultations, or confirmation beyond the initial visit, a service fee will apply per visit. This includes revisits due to client-requested changes, access issues, or site unpreparedness. The customer is responsible for obtaining any required HOA approvals or permits. Shadeotech is not liable for violations or removal requests.

Wall and Slope Deviations Patio walls and floors are often uneven or sloped, which may cause one side to sit higher than the other. As a result, fabric may not hang perfectly straight. Shadeotech is not responsible for these deviations, as they are inherent to the structure. During installation, we may make small alterations such as shaving edges or notching wood to allow proper fitting. Any work beyond minor adjustments (including masonry or structural modifications) is the sole responsibility of the client and not included in Shadeotech's services.

Client-Provided Measurements Disclaimer If the Customer chooses to provide their own measurements instead of having Shadeotech measure the windows, the Customer assumes full responsibility for the accuracy of all dimensions submitted for manufacturing. Shadeotech will manufacture products strictly according to the measurements provided by the Customer. Because all products are custom-made, Shadeotech is not responsible for errors, improper fit, or performance issues resulting from incorrect or incomplete measurements supplied by the Customer. If a remake, adjustment, or replacement is required due to measurement inaccuracies, the Customer agrees that all associated costs will be the Customer's responsibility. This includes, but is not limited to, remanufacturing fees, material costs, shipping, and additional service or installation charges.

Gaps If the surfaces where side tracks are installed are not straight, small gaps may appear along the edges. In such cases, we may use foam or filler to reduce visibility of gaps. These adjustments are functional solutions, but complete elimination of gaps cannot be guaranteed. Shadeotech is not responsible for aesthetic concerns arising from wall or surface irregularities.

Installation and Site Preparation The client is responsible for ensuring that the installation site is clear and ready for Shadeotech's employees and subcontractors to perform their work. This includes ensuring that the path to the installation area is unobstructed and that any furniture, valuables, or other items are moved out of the way prior to the scheduled installation time. Shadeotech and its employees are not permitted to move or handle any of the client's belongings. The client agrees that Shadeotech is not liable for any damages to the client's property, including but not limited to furniture, valuables, or any other items, resulting from the installation process. The client assumes full responsibility for any loss or damage that may occur due to the client's failure to adequately prepare the site. The client understands that during installation, walls, window trims, and window sills may incur damage. Shadeotech is not responsible for failures due to mounting into structurally unsound or non-standard surfaces. The client releases Shadeotech from liability, and Shadeotech is not responsible for any damage that may occur. Shadeotech shall not be liable for any damages, injuries, or losses arising from the installation, use, or operation of its products. The client assumes full responsibility for ensuring proper maintenance, use, and operation. Shadeotech makes no guarantees regarding installation in non-recommended settings and voids any warranty for installations that do not follow professional recommendations. If the client is not present for the scheduled installation, the Shadeotech team will wait for 15 minutes. After this period, the client will need to reschedule and pay an additional service charge. If blind removal is required before installation, the client acknowledges that there will be a fee for the removal and disposal.

1. Definitions "Company" refers to Shadeotech Inc. "Customer" means the purchaser of goods and/or services from the Company. "Goods" refer to all products sold, customized, and/or installed by the Company. "Terms" refer to the Terms and Conditions set forth in this agreement.

2. Cancellation & Refunds Once a deposit has been received and the order placed into production, the order is non-cancelable and non-refundable. Shadeotech reserves the right to reject any cancellation or modification request after order confirmation. If exceptions are made, additional charges may apply at Shadeotech's sole discretion.

3. Ownership & Risk Transfer Title to the Goods remains with Shadeotech until full payment is received. Risk of loss or damage to Goods passes to the Customer upon delivery or installation. Customers are responsible for safeguarding installed products from that moment forward.

4. Photo Consent for Marketing Customer acknowledges and agrees that Shadeotech may take before-and-after photographs of the installation site strictly for use in portfolio, training, and marketing purposes including social media. No personal information including names, addresses, or any identifying details will be disclosed. Customer may opt-out in writing before installation if they do not wish for photos of their property to be used.

5. Final Customization Confirmation All orders are custom-made. Once materials are approved and production begins, no changes may be made to design, fabric, mount type, or motorization. If the client is dissatisfied with their custom selection post-installation, modifications can be made for an additional charge. Shadeotech is not responsible for client remorse or preference change after manufacturing has begun.

6. Inspection Customer must inspect installed products immediately. Any issues or discrepancies must be reported to Shadeotech in writing within 24 hours of installation. After this window, all products will be deemed accepted in full working condition.

7. Force Majeure The Company shall not be liable for any failure to perform its obligations where such failure results from any cause beyond the Company's reasonable control, including but not limited to natural disasters, labor disputes, delays by suppliers, or government actions.

8. Severability If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

9. Waiver Failure by the Company to enforce any provision of these Terms shall not be construed as a waiver of any provision or right.

10. Governing Law This agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this agreement shall be subject to the exclusive jurisdiction of the courts located in Texas.

Acknowledgment By signing below, I hereby acknowledge that I have read, understood, and agree to be bound by the above terms and conditions. I also confirm that I have reviewed the quote and all the provided information is accurate and correct.

________________________________________ ___________________________________
Full Name                                  Address of Installation Site

_________________________________________ _________________________________
Signature                                  Date`,
  contract_3: `Thank You for Choosing Shadeotech!
We truly appreciate your business and the opportunity to serve you. At Shadeotech, we believe in transparency, we hate surprises as much as you do. Please take a moment to carefully review the following agreement to ensure everything goes smoothly with your project. Please review the estimate thoroughly to ensure the accuracy of the selected fabric model number and details such as mount type, motor, window style, and cord specifications. Changes or refunds are not permitted after the order has been approved and placed. The client acknowledges that they have thoroughly reviewed the quote and confirmed that all information is correct. Any modifications requested after order approval must be submitted in writing and may require a revised invoice, updated timeline, and additional charges.

Payment Terms To initiate the manufacturing process, a down payment equal to fifty percent (50%) of the total purchase price is required. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products. Payments can be made via check, Zelle transfer, or credit card. Payments via check should be made out to "SHADEOTECH." Zelle transfers should be directed to info@shadeotech.com. Please note that payments made by credit card will incur a surcharge of three percent (3%) of the total transaction amount. Financing will incur a ten percent (10%) charge that the financing provider charges on top of the invoice total. All sales are final and non-refundable. By placing an order, the client agrees that they have reviewed and accepted all product specifications, designs, and dimensions. SHADEOTECH is not liable for any discrepancies once the order has been confirmed by the client. The client agrees that any disputes regarding payment will be resolved amicably and in good faith between both parties. However, the client also agrees to waive their right to withhold payment or initiate a chargeback or payment dispute with their bank or credit card provider. Failure to adhere to the agreed payment terms may result in legal action to recover the outstanding balance, including any additional costs incurred by SHADEOTECH in the process of collection, including but not limited to legal fees. If a client places an order that requires multiple phases and multiple invoices, any unpaid invoices will void the warranty on all products and services provided. Additionally, no installation will occur until all balances are settled in full. This payment is due upon order placement. The remaining balance must be paid in full prior to the delivery or installation of the products.

I understand that my balance must be paid in full prior to the scheduled installation date. If full payment is not received before installation, a late fee of $75 per day will apply until the outstanding balance is settled. If I have proceeded with financing, I acknowledge that the financing provider operates under its own terms and conditions. I further understand that all of Shadeotech's approved financing providers apply a 10% financing fee, which is separate from and in addition to any fees or terms provided by the financing company.

Multiple Invoices For projects with multiple invoices—such as different phases for interior and exterior installations or sections broken into multiple parts—you must settle the balance for each phase before we can proceed to the next stage. We reserve the right to not proceed with subsequent phases if your previous payments were late.

Late Payment If the full payment is not made by the time of installation, a late payment fee of $75 per day will be applied starting from the date of installation until the outstanding balance is settled in full. The customer acknowledges and agrees that the company reserves the right to withhold services or delay installation until the balance is cleared. Additionally, if there is any outstanding balance after the installation is complete, the warranty will be void. If any invoice remains unpaid beyond the due date and Shadeotech is required to initiate collection efforts, the client agrees to be responsible for all costs associated with the recovery of the outstanding balance. This includes, but is not limited to, collection agency fees, attorney fees, court costs, and interest on the unpaid balance at the maximum rate permitted by Texas law. These fees will be added to the total amount due and are enforceable under this agreement.

Electrical Work Any electrical work required for the installation or operation of Shadeotech products is the sole responsibility of the client. Shadeotech does not perform electrical work and is not licensed or authorized to do so. We are not liable for any damages, malfunctions, or safety issues resulting from electrical work performed by a third-party electrician or by the client themselves. We have no control over the color of wires provided with motors or chargers, as these are standard from the manufacturer and cannot be customized. Shadeotech does not paint or alter any electrical components. If a client chooses to use an extension cord or any alternative power setup that does not involve directly plugging the shade into a standard outlet, all responsibility for performance, safety, and compliance lies with the homeowner. All costs related to third-party electrical services are the sole responsibility of the client, and Shadeotech shall not be held liable for any issues arising from such services.

Aluminum Components By default, roller shades will come with a steel beaded chain. If you prefer a white or black plastic chain, you must specify this at the time of ordering. However, we do not recommend plastic chains as they are less durable. All other shades will have color-coordinated cords. Both chains and cords are custom-cut to match the length of each window for a precise fit. By law, all chains and cords must be securely screwed to the wall for safety compliance. If you choose not to have them secured, you may sign a waiver acknowledging the risks.

Solar Panel Obstruction Policy If any obstruction (e.g., furniture, fixtures, new construction, landscaping, screens, or structural changes) appears in front of a solar panel after installation, and repositioning is required, a trip charge will apply to move the solar panel to an alternative position. Additionally, the Customer acknowledges that solar-powered motors rely entirely on adequate sunlight exposure to maintain battery charge. Shadeotech is not responsible for reduced performance or charging issues caused by insufficient sunlight, improper panel orientation, shaded window placement, weather conditions, or seasonal changes in sun intensity and angle. Shadeotech does not control the availability of sunlight or environmental conditions affecting solar charging.

Smart Hub & Timer Configuration For security reasons, Shadeotech will not program or configure any smart hubs that are connected to a customer's WiFi network. Customers are responsible for programming and managing their own smart hubs to ensure the security of their network and devices. If the client has a remote with a timer function, Shadeotech will not configure the timer. Shadeotech is not responsible for any issues, disruptions, malfunctions, or loss of functionality caused by third-party applications, firmware updates, platform outages, WiFi/router changes, or compatibility limitations. This includes, but is not limited to, apps such as Bond, Somfy, Tuya, Amazon Alexa, Google Home, Apple HomeKit, or any other external smart control system. If the Customer experiences problems related to a third-party app or smart platform, the Customer agrees that they must contact the third-party provider directly for troubleshooting and support. Shadeotech shall not be liable for service calls, reprogramming, or operational issues arising from third-party software or systems outside of Shadeotech's control.

Remote & Programming Policy If a remote is damaged, dropped, exposed to moisture, or tampered with in any way, including alterations to the programming, the product warranty will be void. This includes any instances where the client opens the shade motor housing, interferes with wiring, or attempts reprogramming without Shadeotech's guidance. Clients are advised not to make any changes to the remote settings or motor configurations after installation. Any service required to correct issues caused by such tampering will incur a trip charge starting at $125, plus the cost of repair or replacement.

Battery Maintenance Requirement The Client agrees to charge each rechargeable battery motor using the charger provided by Shadeotech at least once every six (6) months, regardless of whether the motor has been in use. This requirement is necessary to maintain optimal battery health and performance. Failure to follow this maintenance requirement may void the warranty on the motor and battery.

Timeline The delivery timeframe for your shades can range from 2 days to 8 weeks, depending on the product and fabric selected, or as indicated by your consultant. While we strive to complete deliveries within 4 weeks from acceptance of the contract and initial payment, unforeseen circumstances may occasionally lead to delays. Shadeotech shall not be held liable for delays in product delivery due to circumstances beyond its control, including but not limited to, natural disasters, transportation disruptions, or supplier delays.

Warranty We offer a limited lifetime warranty on our products, which means your warranty is valid as long as you reside in your house. Warranty registration is required on our website at https://shadeotech.com/warranty-registration/. Warranty registrations must be completed within 30 days of installation. Motors have a 5-year warranty. For any issues, contact us via phone or our website. This warranty excludes conditions from accidents, misuse, or neglect. If there is any outstanding balance after the installation is complete, the warranty will be void. If a motor is charged with any charger other than the one provided by Shadeotech, the warranty will be void due to variations in wattage that may cause damage. Warranty does not cover damage caused by extreme weather or natural events.

Trip Charge Policy A trip charge starting at $125 will apply for all service visits, including warranty claims, non-warranty repairs, or adjustments caused by factors outside of Shadeotech's control. This includes, but is not limited to, issues resulting from user error, damage, third-party interference, environmental factors, or changes to the home that affect shade operation after installation. Warranty claims still require a technician visit to evaluate and resolve the issue, and the trip charge applies in all cases. If additional site visits are required for further measurements, consultations, or confirmation beyond the initial visit, a service fee will apply per visit. This includes revisits due to client-requested changes, access issues, or site unpreparedness. The customer is responsible for obtaining any required HOA approvals or permits. Shadeotech is not liable for violations or removal requests.

High Ceiling(s) Measuring high ceiling windows is challenging. Our technicians take utmost care during measurement, but a margin of error of ±1 inches might occur. Adjustments will be made during installation if necessary.

Fabric Wrapping Disclaimer We do not recommend fabric wrapping the cassette or bottom rail. The client acknowledges that if dust or dirt gets into the crevices or if the tape wears off, it will not be covered by warranty. A replacement can be done at an additional charge.

Window Deviation and Workaround Windows may deviate slightly, with differences up to 1in. Our shades are precisely crafted; however, window deviations may cause a slight angle at the bottom. We recommend installing without spacers to minimize visibility of deviations, though spacers can be used to level the window if necessary. Shadeotech is not responsible for any inherent flaws in window construction.

Gaps Blinds and shades may have small gaps to prevent damage during operation. These gaps do not allow detailed visibility from outside but might show light and movement. For enhanced light control and privacy, you may opt to add a side channel track that gets installed on either side of the blinds or shades. The client acknowledges that walls are not always perfectly straight. Shadeotech shades are cut by a precision machine and are perfectly straight when manufactured. If any slopes or gaps appear on any side after installation, it is due to wall irregularities and not a defect in the product. Shadeotech is not responsible for any aesthetic concerns caused by wall unevenness.

Client-Provided Measurements Disclaimer: If the Customer chooses to provide their own measurements instead of having Shadeotech measure the windows, the Customer assumes full responsibility for the accuracy of all dimensions submitted for manufacturing. Shadeotech will manufacture products strictly according to the measurements provided by the Customer. Because all products are custom-made, Shadeotech is not responsible for errors, improper fit, or performance issues resulting from incorrect or incomplete measurements supplied by the Customer. If a remake, adjustment, or replacement is required due to measurement inaccuracies, the Customer agrees that all associated costs will be the Customer's responsibility. This includes, but is not limited to, remanufacturing fees, material costs, shipping, and additional service or installation charges.

Installation and Site Preparation The client is responsible for ensuring that the installation site is clear and ready for Shadeotech's employees and subcontractors to perform their work. This includes ensuring that the path to the installation area is unobstructed and that any furniture, valuables, or other items are moved out of the way prior to the scheduled installation time. Shadeotech and its employees are not permitted to move or handle any of the client's belongings. The client agrees that Shadeotech is not liable for any damages to the client's property, including but not limited to furniture, valuables, or any other items, resulting from the installation process. The client assumes full responsibility for any loss or damage that may occur due to the client's failure to adequately prepare the site. The client understands that during installation, walls, window trims, and window sills may incur damage. Shadeotech is not responsible for failures due to mounting into structurally unsound or non-standard surfaces. The client releases Shadeotech from liability, and Shadeotech is not responsible for any damage that may occur. Shadeotech shall not be liable for any damages, injuries, or losses arising from the installation, use, or operation of its products. The client assumes full responsibility for ensuring proper maintenance, use, and operation. Shadeotech makes no guarantees regarding installation in non-recommended settings and voids any warranty for installations that do not follow professional recommendations. If the client is not present for the scheduled installation, the Shadeotech team will wait for 15 minutes. After this period, the client will need to reschedule and pay an additional service charge. If blind removal is required before installation, the client acknowledges that there will be a fee for the removal and disposal.

1. Definitions "Company" refers to Shadeotech Inc. "Customer" means the purchaser of goods and/or services from the Company. "Goods" refer to all products sold, customized, and/or installed by the Company. "Terms" refer to the Terms and Conditions set forth in this agreement.

2. Cancellation & Refunds Once a deposit has been received and the order placed into production, the order is non-cancelable and non-refundable. Shadeotech reserves the right to reject any cancellation or modification request after order confirmation. If exceptions are made, additional charges may apply at Shadeotech's sole discretion.

3. Ownership & Risk Transfer Title to the Goods remains with Shadeotech until full payment is received. Risk of loss or damage to Goods passes to the Customer upon delivery or installation. Customers are responsible for safeguarding installed products from that moment forward.

4. Photo Consent for Marketing Customer acknowledges and agrees that Shadeotech may take before-and-after photographs of the installation site strictly for use in portfolio, training, and marketing purposes including social media. No personal information including names, addresses, or any identifying details will be disclosed. Customer may opt-out in writing before installation if they do not wish for photos of their property to be used.

5. Final Customization Confirmation All orders are custom-made. Once materials are approved and production begins, no changes may be made to design, fabric, mount type, or motorization. If the client is dissatisfied with their custom selection post-installation, modifications can be made for an additional charge. Shadeotech is not responsible for client remorse or preference change after manufacturing has begun.

6. Inspection Customer must inspect installed products immediately. Any issues or discrepancies must be reported to Shadeotech in writing within 24 hours of installation. After this window, all products will be deemed accepted in full working condition.

7. Force Majeure The Company shall not be liable for any failure to perform its obligations where such failure results from any cause beyond the Company's reasonable control, including but not limited to natural disasters, labor disputes, delays by suppliers, or government actions.

8. Severability If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

9. Waiver Failure by the Company to enforce any provision of these Terms shall not be construed as a waiver of any provision or right.

10. Governing Law This agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this agreement shall be subject to the exclusive jurisdiction of the courts located in Texas.

Acknowledgment By signing below, I hereby acknowledge that I have read, understood, and agree to be bound by the above terms and conditions. I also confirm that I have reviewed the quote and all the provided information is accurate and correct.

________________________________________ ___________________________________
Full Name Address of Installation Site

_________________________________________ _________________________________
Signature Date`,
}

const fabricCategories = [
  { id: 'blackout', name: 'Blackout' },
  { id: 'sunscreen', name: 'Sunscreen' },
  { id: 'sheer', name: 'Sheer' },
  { id: 'dimout', name: 'Dimout' },
  { id: 'privacy', name: 'Privacy' },
]

const fabricOptions = [
  { id: 'natural-linen', name: 'Natural Linen' },
  { id: 'slate-grey', name: 'Slate Grey' },
  { id: 'pure-white', name: 'Pure White' },
  { id: 'pebble', name: 'Pebble' },
  { id: 'ocean-blue', name: 'Ocean Blue' },
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'ivory', name: 'Ivory' },
  { id: 'sand', name: 'Sand' },
]

interface AddOn {
  id: string
  name: string
  price: number
  description: string
}

interface AuditLogEntry {
  timestamp: string
  userName: string
  userEmail: string
  action: string
  actionBadge: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  entityType: string
  entityId: string
  details: string
}

export default function SettingsPage() {
  const { priceTable, setGlobalAdjust, globalAdjust } = useQuotesStore()
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [products, setProducts] = useState(mockProducts)
  const [users, setUsers] = useState<UserData[]>([])
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [rejectingUser, setRejectingUser] = useState<UserData | null>(null)
  const { config: invoiceConfig } = useInvoiceTemplateStore()
  const [invoiceStyleSaving, setInvoiceStyleSaving] = useState(false)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null)
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyAddressLoading, setCompanyAddressLoading] = useState(false)
  const [companyAddressSaving, setCompanyAddressSaving] = useState(false)
  const [ticketSubjects, setTicketSubjects] = useState<string[]>([])
  const [newTicketSubjectInput, setNewTicketSubjectInput] = useState('')
  const [ticketSubjectsSaving, setTicketSubjectsSaving] = useState(false)

  const [bookingBuffer, setBookingBuffer] = useState(2)
  const [bookingStartHour, setBookingStartHour] = useState(10)
  const [bookingLastSlotHour, setBookingLastSlotHour] = useState(15)
  const [bookingSettingsSaving, setBookingSettingsSaving] = useState(false)

  const [migratingNumbers, setMigratingNumbers] = useState(false)
  const [numberMigrateResult, setNumberMigrateResult] = useState<string | null>(null)

  const runNumberMigration = async () => {
    setMigratingNumbers(true)
    setNumberMigrateResult(null)
    try {
      const res = await fetch('/api/admin/migrate-numbers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Migration failed')
      setNumberMigrateResult(`Done — Invoices: ${data.invoicesMigrated}, Estimates: ${data.quotesMigrated}, Contracts: ${data.contractsMigrated}`)
    } catch (e) {
      setNumberMigrateResult(e instanceof Error ? e.message : 'Error')
    } finally {
      setMigratingNumbers(false)
    }
  }

  const refetchUsers = async () => {
    if (!token) return
    try {
      setUsersLoading(true)
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      const all = (data.users || []) as UserData[]
      setUsers(all.filter((u: UserData) => u.role === 'STAFF' || u.role === 'ADMIN'))
      setPendingUsers(all.filter((u: UserData) => (u.role === 'DEALER' || u.role === 'CUSTOMER') && !u.isActive))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (token) refetchUsers()
  }, [token])

  const fetchAuditLogs = async () => {
    if (!token) return
    setAuditLogsLoading(true)
    setAuditLogsError(null)
    try {
      const response = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch audit logs')
      }
      const data = await response.json()
      setAuditLogs(data.auditLogs || [])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load audit logs'
      setAuditLogsError(message)
      setAuditLogs([])
    } finally {
      setAuditLogsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchAuditLogs()
  }, [token])

  const fetchCompanyAddress = async () => {
    setCompanyAddressLoading(true)
    try {
      const response = await fetch('/api/settings/company')
      if (response.ok) {
        const data = await response.json()
        setCompanyAddress(data.companyAddress || '')
        if (Array.isArray(data.ticketSubjects) && data.ticketSubjects.length > 0) {
          setTicketSubjects(data.ticketSubjects)
        } else {
          setTicketSubjects(['Add New', 'Solar Not Charging', 'Motor Not Working', 'Programming Issues', 'Exterior Zip Issue', 'Installation Issues', 'Remote Not Working', 'Missing Item', 'Chain/Cord Broken', 'Other'])
        }
        const normalizedTemplates = normalizeStoredContractTemplates(data.contractTemplates)
        if (normalizedTemplates) {
          setContractContents(storedToSettingsContents(normalizedTemplates, DEFAULT_CONTRACT_CONTENTS))
        } else if (token) {
          // Bootstrap DB templates from current Settings defaults so contracts pages can consume them.
          const bootstrapResponse = await fetch('/api/settings/company', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              contractTemplates: settingsContentsToStored(DEFAULT_CONTRACT_CONTENTS),
            }),
          })
          if (bootstrapResponse.ok) {
            const bootstrapData = await bootstrapResponse.json()
            const bootstrappedTemplates = normalizeStoredContractTemplates(bootstrapData.contractTemplates)
            if (bootstrappedTemplates) {
              setContractContents(storedToSettingsContents(bootstrappedTemplates, DEFAULT_CONTRACT_CONTENTS))
            }
          }
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load company address.',
        variant: 'destructive',
      })
    } finally {
      setCompanyAddressLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyAddress()
  }, [token])

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/booking-settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setBookingBuffer(d.bookingBuffer ?? 2)
          setBookingStartHour(d.bookingStartHour ?? 10)
          setBookingLastSlotHour(d.bookingLastSlotHour ?? 15)
        }
      })
      .catch(() => {})
  }, [token])

  const saveTicketSubjects = async (subjects: string[]) => {
    if (!token) return
    setTicketSubjectsSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketSubjects: subjects }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setTicketSubjects(data.ticketSubjects ?? subjects)
      toast({ title: 'Ticket subjects saved' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save ticket subjects.', variant: 'destructive' })
    } finally {
      setTicketSubjectsSaving(false)
    }
  }

  const saveBookingSettings = async () => {
    if (!token) return
    setBookingSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/booking-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingBuffer, bookingStartHour, bookingLastSlotHour }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Booking settings saved' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save booking settings.', variant: 'destructive' })
    } finally {
      setBookingSettingsSaving(false)
    }
  }

  const saveInvoiceStyle = async () => {
    if (!token) return
    setInvoiceStyleSaving(true)
    try {
      const response = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceTemplateConfig: invoiceConfig }),
      })
      if (!response.ok) throw new Error('Failed to save')
      toast({ title: 'Invoice style saved', description: 'Dealers and customers will now see invoices in this style.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save invoice style.', variant: 'destructive' })
    } finally {
      setInvoiceStyleSaving(false)
    }
  }

  const saveCompanyAddress = async () => {
    if (!token) return
    setCompanyAddressSaving(true)
    try {
      const response = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyAddress: companyAddress.trim() }),
      })
      if (!response.ok) throw new Error('Failed to save')
      const data = await response.json()
      setCompanyAddress(data.companyAddress || '')
      toast({
        title: 'Saved',
        description: 'Shadeotech address updated. Commute time in calendar and customer pages will use this address.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save company address.',
        variant: 'destructive',
      })
    } finally {
      setCompanyAddressSaving(false)
    }
  }

  const saveContractTemplates = async (nextContents: Record<string, string>) => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save contract templates.',
        variant: 'destructive',
      })
      return false
    }

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contractTemplates: settingsContentsToStored(nextContents),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save contract templates')
      }

      const data = await response.json()
      const normalizedTemplates = normalizeStoredContractTemplates(data.contractTemplates)
      if (normalizedTemplates) {
        setContractContents(storedToSettingsContents(normalizedTemplates, nextContents))
      } else {
        setContractContents(nextContents)
      }
      return true
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save contract templates.',
        variant: 'destructive',
      })
      return false
    }
  }
  
  // Add-ons state
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [addOnsLoading, setAddOnsLoading] = useState(true)
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null)
  const [editAddOnDialogOpen, setEditAddOnDialogOpen] = useState(false)
  const [editAddOnForm, setEditAddOnForm] = useState({ name: '', price: '', description: '' })

  const fetchAddOns = async () => {
    try {
      setAddOnsLoading(true)
      const res = await fetch('/api/addons')
      if (!res.ok) throw new Error('Failed to fetch add-ons')
      const data = await res.json()
      setAddOns(data.addOns ?? [])
    } catch (error) {
      console.error('Error fetching add-ons:', error)
      toast({ title: 'Error', description: 'Failed to load add-ons.', variant: 'destructive' })
    } finally {
      setAddOnsLoading(false)
    }
  }

  useEffect(() => {
    fetchAddOns()
  }, [])
  
  const [activeTab, setActiveTab] = useState('pricing')
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [addOnDialogOpen, setAddOnDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [contractContents, setContractContents] = useState<Record<string, string>>(DEFAULT_CONTRACT_CONTENTS)
  const [editingContractContent, setEditingContractContent] = useState('')
  
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    description: '',
    basePrice: '',
    minSize: '',
    maxSize: '',
  })
  
  const [addOnForm, setAddOnForm] = useState({
    name: '',
    price: '',
    description: '',
  })
  
  const [userForm, setUserForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF' | 'DEALER' | 'CUSTOMER',
    isActive: true,
  })
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null)
  const [permDialogUser, setPermDialogUser] = useState<UserData | null>(null)
  const [permDialogData, setPermDialogData] = useState<Record<string, PermLevel>>({})
  const [savingPerms, setSavingPerms] = useState(false)

  // Help Library state
  const [helpLibraryItems, setHelpLibraryItems] = useState<Array<{
    id: string
    title: string
    type: 'PDF' | 'Video'
    category: string
    description: string
    url: string
    uploadDate?: Date
  }>>([])
  const [helpLibraryItemsLoading, setHelpLibraryItemsLoading] = useState(true)
  const [helpAddingLoading, setHelpAddingLoading] = useState(false)

  // Care & Maintenance state
  const [careItems, setCareItems] = useState<Array<{
    id: string
    title: string
    type: 'PDF' | 'Video'
    category: string
    description: string
    url: string
    uploadDate?: Date
  }>>([])
  const [careItemsLoading, setCareItemsLoading] = useState(true)
  const [careAddingLoading, setCareAddingLoading] = useState(false)

  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [careDialogOpen, setCareDialogOpen] = useState(false)
  const [helpForm, setHelpForm] = useState({
    title: '',
    type: 'PDF' as 'PDF' | 'Video',
    category: '',
    description: '',
    url: '',
    file: null as File | null,
  })
  const [careForm, setCareForm] = useState({
    title: '',
    type: 'PDF' as 'PDF' | 'Video',
    category: '',
    description: '',
    url: '',
    file: null as File | null,
  })

  const [fabricAddDialogOpen, setFabricAddDialogOpen] = useState(false)
  const [fabricForm, setFabricForm] = useState({
    fabric: '',
    category: '',
    size: '',
    minWidth: '',
    maxWidth: '',
  })
  const [fabricSpecs, setFabricSpecs] = useState<Array<{ id: string; fabric: string; category: string; size: string; minWidth: string; maxWidth: string }>>([
    { id: 'fabric_demo_1', fabric: 'Natural Linen', category: 'Sheer', size: 'Standard', minWidth: '80', maxWidth: '120' },
    { id: 'fabric_demo_2', fabric: 'Slate Grey', category: 'Blackout', size: 'Large', minWidth: '100', maxWidth: '150' },
    { id: 'fabric_demo_3', fabric: 'Pure White', category: 'Dimout', size: 'Standard', minWidth: '60', maxWidth: '100' },
  ])

  const handleAddFabricSpec = (): boolean => {
    if (!fabricForm.fabric || !fabricForm.category || !fabricForm.size || !fabricForm.minWidth || !fabricForm.maxWidth) return false
    const minW = parseFloat(fabricForm.minWidth)
    const maxW = parseFloat(fabricForm.maxWidth)
    if (Number.isNaN(minW) || Number.isNaN(maxW) || minW > maxW) return false
    const fabricName = fabricOptions.find((f) => f.id === fabricForm.fabric)?.name ?? fabricForm.fabric
    const categoryName = fabricCategories.find((c) => c.id === fabricForm.category)?.name ?? fabricForm.category
    setFabricSpecs((prev) => [
      ...prev,
      {
        id: `fabric_${Date.now()}`,
        fabric: fabricName,
        category: categoryName,
        size: fabricForm.size,
        minWidth: fabricForm.minWidth,
        maxWidth: fabricForm.maxWidth,
      },
    ])
    setFabricForm({ fabric: '', category: '', size: '', minWidth: '', maxWidth: '' })
    setFabricAddDialogOpen(false)
    return true
  }

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.category || !productForm.basePrice) return
    if (!productForm.minSize || !productForm.maxSize) return
    const min = parseFloat(productForm.minSize)
    const max = parseFloat(productForm.maxSize)
    if (Number.isNaN(min) || Number.isNaN(max) || min > max) return

    setProducts([...products, {
      id: `prod_${Date.now()}`,
      name: productForm.name,
      category: productForm.category,
      description: productForm.description,
      basePrice: parseFloat(productForm.basePrice),
      isActive: true,
    }])
    setProductForm({ name: '', category: '', description: '', basePrice: '', minSize: '', maxSize: '' })
    setProductDialogOpen(false)
  }

  const handleAddAddOn = async () => {
    if (!addOnForm.name || !addOnForm.price) return
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: addOnForm.name,
          price: parseFloat(addOnForm.price),
          description: addOnForm.description,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create add-on')
      }
      const data = await res.json()
      setAddOns((prev) => [...prev, data.addOn])
      setAddOnForm({ name: '', price: '', description: '' })
      setAddOnDialogOpen(false)
      toast({ title: 'Success', description: 'Add-on created.' })
    } catch (error) {
      console.error('Error creating add-on:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create add-on.', variant: 'destructive' })
    }
  }

  const handleDeleteAddOn = async (id: string) => {
    try {
      const res = await fetch(`/api/addons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete add-on')
      }
      setAddOns((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Success', description: 'Add-on deleted.' })
    } catch (error) {
      console.error('Error deleting add-on:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete add-on.', variant: 'destructive' })
    }
  }

  const handleEditAddOn = async () => {
    if (!editingAddOn || !editAddOnForm.name || !editAddOnForm.price) return
    try {
      const res = await fetch(`/api/addons/${editingAddOn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editAddOnForm.name,
          price: parseFloat(editAddOnForm.price),
          description: editAddOnForm.description,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update add-on')
      }
      const data = await res.json()
      setAddOns((prev) => prev.map((a) => (a.id === editingAddOn.id ? data.addOn : a)))
      setEditAddOnDialogOpen(false)
      setEditingAddOn(null)
      toast({ title: 'Success', description: 'Add-on updated.' })
    } catch (error) {
      console.error('Error updating add-on:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update add-on.', variant: 'destructive' })
    }
  }

  const handleSaveUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!editingUser && !userForm.password) {
      toast({
        title: 'Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      })
      return
    }

    if (userForm.phone) {
      const phoneErr = validatePhone(userForm.phone)
      if (phoneErr) {
        toast({ title: 'Invalid phone', description: phoneErr, variant: 'destructive' })
        return
      }
    }

    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id || editingUser._id}`
        : '/api/auth/register'
      
      const method = editingUser ? 'PUT' : 'POST'
      const body = editingUser
        ? {
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            phone: userForm.phone || undefined,
            role: userForm.role,
            isActive: true,
            ...(userForm.password && { password: userForm.password }),
          }
        : {
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            phone: userForm.phone || undefined,
            password: userForm.password,
            role: userForm.role,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save user')
      }

      toast({
        title: 'Success',
        description: editingUser ? 'User updated successfully' : 'User created successfully',
        variant: 'success',
      })

      await refetchUsers()
      setUserForm({ id: '', firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STAFF', isActive: true })
      setEditingUser(null)
      setUserDialogOpen(false)
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save user. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/users/${deletingUser.id || deletingUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
        variant: 'success',
      })

      await refetchUsers()
      setDeletingUser(null)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleApproveUser = async (user: UserData) => {
    const id = user.id || user._id
    try {
      setPendingActionId(id)
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to approve')
      }
      toast({
        title: 'Success',
        description: 'User approved. They can now log in.',
        variant: 'success',
      })
      await refetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user.',
        variant: 'destructive',
      })
    } finally {
      setPendingActionId(null)
    }
  }

  const handleRejectUser = async () => {
    if (!rejectingUser) return
    const id = rejectingUser.id || rejectingUser._id
    try {
      setPendingActionId(id)
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to reject')
      }
      toast({
        title: 'Success',
        description: 'Signup request rejected.',
        variant: 'success',
      })
      await refetchUsers()
      setRejectingUser(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request.',
        variant: 'destructive',
      })
    } finally {
      setPendingActionId(null)
    }
  }

  const openPermDialog = (user: UserData) => {
    const existing = user.permissions || {}
    const initial: Record<string, PermLevel> = {}
    PERM_CATEGORIES.forEach((c) => {
      const v = existing[c.id]
      initial[c.id] = (PERM_LEVELS as readonly string[]).includes(v) ? (v as PermLevel) : 'no'
    })
    setPermDialogData(initial)
    setPermDialogUser(user)
  }

  const handleSavePermissions = async () => {
    if (!permDialogUser || !token) return
    const id = permDialogUser.id || permDialogUser._id
    try {
      setSavingPerms(true)
      const res = await fetch(`/api/users/${id}/permissions`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permDialogData }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      toast({ title: 'Permissions saved', description: `${permDialogUser.name}'s permissions updated.` })
      setPermDialogUser(null)
      await refetchUsers()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSavingPerms(false)
    }
  }

  // Fetch help library items from API
  useEffect(() => {
    const fetchHelpItems = async () => {
      try {
        setHelpLibraryItemsLoading(true)
        const response = await fetch('/api/help-library', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch help items')
        const data = await response.json()
        setHelpLibraryItems(data.helpItems || [])
      } catch (error) {
        console.error('Error fetching help items:', error)
        toast({
          title: 'Error',
          description: 'Failed to load help items. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setHelpLibraryItemsLoading(false)
      }
    }
    fetchHelpItems()
  }, [token, toast])

  const handleAddHelpItem = async () => {
    if (!helpForm.title || !helpForm.category || !helpForm.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    if (helpForm.type === 'Video' && !helpForm.url && !helpForm.file) {
      toast({
        title: 'Validation Error',
        description: 'Please provide either a video file or URL.',
        variant: 'destructive',
      })
      return
    }
    if (helpForm.type === 'PDF' && !helpForm.file) {
      toast({
        title: 'Validation Error',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      })
      return
    }

    setHelpAddingLoading(true)
    try {
      let cloudinaryUrl = ''
      let cloudinaryPublicId = ''
      let finalUrl = helpForm.url || ''

      // Upload file to Cloudinary if a file is provided
      if (helpForm.file) {
        const formData = new FormData()
        formData.append('file', helpForm.file)
        formData.append('type', helpForm.type)

        const uploadResponse = await fetch('/api/help-library/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const uploadData = await uploadResponse.json()
        cloudinaryUrl = uploadData.url
        cloudinaryPublicId = uploadData.publicId
        finalUrl = cloudinaryUrl
      }

      // Create help item via API
      const createResponse = await fetch('/api/help-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: helpForm.title,
          type: helpForm.type,
          category: helpForm.category,
          description: helpForm.description,
          url: finalUrl || helpForm.url || undefined,
          cloudinaryUrl: cloudinaryUrl || undefined,
          cloudinaryPublicId: cloudinaryPublicId || undefined,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create help item')
      }

      const data = await createResponse.json()
      setHelpLibraryItems([...helpLibraryItems, data.helpItem])
      setHelpForm({ title: '', type: 'PDF', category: '', description: '', url: '', file: null })
      setHelpDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Help item added successfully.',
      })
    } catch (error) {
      console.error('Error adding help item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add help item. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setHelpAddingLoading(false)
    }
  }

  const handleDeleteHelpItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this help item?')) return

    try {
      const response = await fetch(`/api/help-library/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete help item')
      }

      setHelpLibraryItems(helpLibraryItems.filter(item => item.id !== id))
      toast({
        title: 'Success',
        description: 'Help item deleted successfully.',
      })
    } catch (error) {
      console.error('Error deleting help item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete help item. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Fetch care items from API
  useEffect(() => {
    const fetchCareItems = async () => {
      try {
        setCareItemsLoading(true)
        const response = await fetch('/api/care-maintenance', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch care items')
        const data = await response.json()
        setCareItems(data.careItems || [])
      } catch (error) {
        console.error('Error fetching care items:', error)
        toast({
          title: 'Error',
          description: 'Failed to load care items. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setCareItemsLoading(false)
      }
    }
    fetchCareItems()
  }, [token, toast])

  const handleAddCareItem = async () => {
    if (!careForm.title || !careForm.category || !careForm.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    if (careForm.type === 'Video' && !careForm.url && !careForm.file) {
      toast({
        title: 'Validation Error',
        description: 'Please provide either a video file or URL.',
        variant: 'destructive',
      })
      return
    }
    if (careForm.type === 'PDF' && !careForm.file) {
      toast({
        title: 'Validation Error',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      })
      return
    }

    setCareAddingLoading(true)
    try {
      let cloudinaryUrl = ''
      let cloudinaryPublicId = ''
      let finalUrl = careForm.url || ''

      // Upload file to Cloudinary if a file is provided
      if (careForm.file) {
        const formData = new FormData()
        formData.append('file', careForm.file)
        formData.append('type', careForm.type)

        const uploadResponse = await fetch('/api/care-maintenance/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const uploadData = await uploadResponse.json()
        cloudinaryUrl = uploadData.url
        cloudinaryPublicId = uploadData.publicId
        finalUrl = cloudinaryUrl
      }

      // Create care item via API
      const createResponse = await fetch('/api/care-maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: careForm.title,
          type: careForm.type,
          category: careForm.category,
          description: careForm.description,
          url: finalUrl || careForm.url || undefined,
          cloudinaryUrl: cloudinaryUrl || undefined,
          cloudinaryPublicId: cloudinaryPublicId || undefined,
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create care item')
      }

      const data = await createResponse.json()
      setCareItems([...careItems, data.careItem])
      setCareForm({ title: '', type: 'PDF', category: '', description: '', url: '', file: null })
      setCareDialogOpen(false)
      toast({
        title: 'Success',
        description: 'Care item added successfully.',
      })
    } catch (error) {
      console.error('Error adding care item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add care item. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCareAddingLoading(false)
    }
  }

  const handleDeleteCareItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this care item?')) return

    try {
      const response = await fetch(`/api/care-maintenance/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete care item')
      }

      setCareItems(careItems.filter(item => item.id !== id))
      toast({
        title: 'Success',
        description: 'Care item deleted successfully.',
      })
    } catch (error) {
      console.error('Error deleting care item:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete care item. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage system settings, pricing, products, users, and templates
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pricing">Pricing</SelectItem>
            <SelectItem value="production-sheets">Production Sheets</SelectItem>
            <SelectItem value="add-ons">Add ons</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="product-images">Product Images</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="invoice-style">Invoice Style</SelectItem>
            <SelectItem value="contracts">Agreements</SelectItem>
            <SelectItem value="help-library">Help Library</SelectItem>
            <SelectItem value="care-maintenance">Care &amp; Maintenance</SelectItem>
            <SelectItem value="address">Address</SelectItem>
            <SelectItem value="audit-logs">Audit Logs</SelectItem>
            <SelectItem value="quote-options">Estimate Options</SelectItem>
            <SelectItem value="booking">Booking Settings</SelectItem>
            <SelectItem value="ticket-subjects">Ticket Subjects</SelectItem>
          </SelectContent>
        </Select>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Pricing Configuration Card - Commented Out */}
          {false && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
              <CardDescription>
                Manage base pricing and global adjustments for all products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Adjustments */}
              <div className="space-y-4">
                <h3 className="font-medium">Global Price Adjustments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Percentage Adjustment (%)</Label>
                    <Input
                      type="number"
                      value={globalAdjust.percent}
                      onChange={(e) => setGlobalAdjust(parseFloat(e.target.value) || 0, globalAdjust.flat)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Positive values increase prices, negative values decrease
                    </p>
                  </div>
                  <div>
                    <Label>Flat Adjustment ($)</Label>
                    <Input
                      type="number"
                      value={globalAdjust.flat}
                      onChange={(e) => setGlobalAdjust(globalAdjust.percent, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Fixed amount added/subtracted from all prices
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Table */}
              <div>
                <h3 className="font-medium mb-4">Base Pricing by Category</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Price per m²</TableHead>
                        <TableHead>Adjusted Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceTable.map((row) => {
                        const adjustedPrice = row.pricePerM2 * (1 + globalAdjust.percent / 100) + globalAdjust.flat
                        return (
                          <TableRow key={row.category}>
                            <TableCell className="font-medium capitalize">
                              {row.category.replace('_', ' ')}
                            </TableCell>
                            <TableCell>{formatCurrency(row.pricePerM2)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(adjustedPrice)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Product Collection Pricing Charts */}
          <ProductCollectionPricingCharts />
        </TabsContent>

        {/* Production Sheets Tab */}
        <TabsContent value="production-sheets" className="space-y-6">
          <ProductionSheetsSettings />
        </TabsContent>

        {/* Add ons Tab */}
        <TabsContent value="add-ons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add ons</CardTitle>
                  <CardDescription>
                    Manage add-on products and services (all items are per shade)
                  </CardDescription>
                </div>
                {/* Add Add-on Dialog */}
                <Dialog open={addOnDialogOpen} onOpenChange={setAddOnDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setAddOnForm({ name: '', price: '', description: '' })}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Add-on</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Add-on Name</Label>
                        <Input
                          value={addOnForm.name}
                          onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })}
                          placeholder="e.g., Fabric Wrap"
                        />
                      </div>
                      <div>
                        <Label>Price per Shade ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={addOnForm.price}
                          onChange={(e) => setAddOnForm({ ...addOnForm, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Description (Optional)</Label>
                        <Textarea
                          value={addOnForm.description}
                          onChange={(e) => setAddOnForm({ ...addOnForm, description: e.target.value })}
                          rows={2}
                          placeholder="Additional notes or specifications"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddOnDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddAddOn}>Add Add-on</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on Name</TableHead>
                      <TableHead>Price per Shade</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addOnsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                          Loading add-ons…
                        </TableCell>
                      </TableRow>
                    ) : addOns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No add-ons yet. Click &quot;Add Item&quot; to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      addOns.map((addon) => (
                        <TableRow key={addon.id}>
                          <TableCell className="font-medium">{addon.name}</TableCell>
                          <TableCell>{formatCurrency(addon.price)}</TableCell>
                          <TableCell className="text-muted-foreground">{addon.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingAddOn(addon)
                                  setEditAddOnForm({ name: addon.name, price: String(addon.price), description: addon.description })
                                  setEditAddOnDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAddOn(addon.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Add-on Dialog */}
          <Dialog open={editAddOnDialogOpen} onOpenChange={(open) => { setEditAddOnDialogOpen(open); if (!open) setEditingAddOn(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Add-on</DialogTitle>
                <DialogDescription>Update the name, price, or description of this add-on.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Add-on Name</Label>
                  <Input
                    value={editAddOnForm.name}
                    onChange={(e) => setEditAddOnForm({ ...editAddOnForm, name: e.target.value })}
                    placeholder="e.g., Fabric Wrap"
                  />
                </div>
                <div>
                  <Label>Price per Shade ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editAddOnForm.price}
                    onChange={(e) => setEditAddOnForm({ ...editAddOnForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={editAddOnForm.description}
                    onChange={(e) => setEditAddOnForm({ ...editAddOnForm, description: e.target.value })}
                    rows={2}
                    placeholder="Additional notes or specifications"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditAddOnDialogOpen(false); setEditingAddOn(null) }}>Cancel</Button>
                <Button onClick={handleEditAddOn}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage product catalog and configurations
                  </CardDescription>
                </div>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="e.g., Roller Shades"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          placeholder="e.g., roller_shades"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          rows={3}
                          placeholder="Product description"
                        />
                      </div>
                      <div>
                        <Label>Base Price per m²</Label>
                        <Input
                          type="number"
                          value={productForm.basePrice}
                          onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Minimum Size</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={productForm.minSize}
                            onChange={(e) => setProductForm({ ...productForm, minSize: e.target.value })}
                            placeholder="e.g. 0"
                            required
                          />
                        </div>
                        <div>
                          <Label>Maximum Size</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={productForm.maxSize}
                            onChange={(e) => setProductForm({ ...productForm, maxSize: e.target.value })}
                            placeholder="e.g. 100"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddProduct}>Add Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.description}</TableCell>
                        <TableCell>{formatCurrency(product.basePrice)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={product.isActive ? 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-0' : 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Images Tab */}
        <TabsContent value="product-images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload and manage product images for catalog display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fabrics Tab — commented out */}
        {/* <TabsContent value="fabrics" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fabric Specifications</CardTitle>
                  <CardDescription>
                    View and add fabric specifications (category, size, minimum width, maximum width).
                  </CardDescription>
                </div>
                <Button onClick={() => setFabricAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add fabric specification
                </Button>
                <Dialog open={fabricAddDialogOpen} onOpenChange={(open) => {
                  setFabricAddDialogOpen(open)
                  if (!open) setFabricForm({ fabric: '', category: '', size: '', minWidth: '', maxWidth: '' })
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add fabric specification</DialogTitle>
                      <DialogDescription>
                        Select a fabric and enter category, size, and width range.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Fabric</Label>
                        <Select
                          value={fabricForm.fabric}
                          onValueChange={(v) => setFabricForm({ ...fabricForm, fabric: v })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select fabric" />
                          </SelectTrigger>
                          <SelectContent>
                            {fabricOptions.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={fabricForm.category}
                          onValueChange={(v) => setFabricForm({ ...fabricForm, category: v })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {fabricCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Size</Label>
                        <Input
                          value={fabricForm.size}
                          onChange={(e) => setFabricForm({ ...fabricForm, size: e.target.value })}
                          placeholder="e.g. Standard, Large"
                          className="mt-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Minimum Width</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={fabricForm.minWidth}
                            onChange={(e) => setFabricForm({ ...fabricForm, minWidth: e.target.value })}
                            placeholder="e.g. 80"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Maximum Width</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={fabricForm.maxWidth}
                            onChange={(e) => setFabricForm({ ...fabricForm, maxWidth: e.target.value })}
                            placeholder="e.g. 120"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setFabricAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleAddFabricSpec()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add fabric specification
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  All fabric specifications. Use the button above to add more.
                </p>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Minimum Width</TableHead>
                        <TableHead>Maximum Width</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fabricSpecs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No fabric specifications yet. Click &quot;Add fabric specification&quot; to create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fabricSpecs.map((spec) => (
                          <TableRow key={spec.id}>
                            <TableCell className="font-medium">{spec.fabric}</TableCell>
                            <TableCell>{spec.category}</TableCell>
                            <TableCell>{spec.size}</TableCell>
                            <TableCell>{spec.minWidth}</TableCell>
                            <TableCell>{spec.maxWidth}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Pending signup requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending signup requests
              </CardTitle>
              <CardDescription>
                Users who signed up and are waiting for approval. Approve to let them log in, or reject to remove the request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No pending signup requests.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Signed up</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id || user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Approve"
                                disabled={pendingActionId === (user.id || user._id)}
                                onClick={() => handleApproveUser(user)}
                              >
                                {pendingActionId === (user.id || user._id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Reject"
                                disabled={pendingActionId === (user.id || user._id)}
                                onClick={() => setRejectingUser(user)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Manage system users and their access
                  </CardDescription>
                </div>
                <Dialog open={userDialogOpen} onOpenChange={(open) => {
                  setUserDialogOpen(open)
                  if (!open) {
                    setEditingUser(null)
                    setUserForm({ id: '', firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STAFF', isActive: true })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingUser(null)
                      setUserForm({ id: '', firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STAFF', isActive: true })
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="user@shadeotech.com"
                        />
                      </div>
                      <div>
                        <Label>Phone (E.164, e.g. +1234567890)</Label>
                        <Input
                          type="tel"
                          value={userForm.phone}
                          onChange={(e) => setUserForm({ ...userForm, phone: sanitizePhoneInput(e.target.value) })}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div>
                        <Label>Password {editingUser && '(leave blank to keep current)'}</Label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          placeholder={editingUser ? "Leave blank to keep current" : "Set initial password"}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as any })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="DEALER">Dealer</SelectItem>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setUserDialogOpen(false)
                        setEditingUser(null)
                        setUserForm({ id: '', firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STAFF', isActive: true })
                      }}>Cancel</Button>
                      <Button onClick={handleSaveUser}>{editingUser ? 'Update User' : 'Add User'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete User</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {deletingUser?.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Reject signup confirmation */}
                <Dialog open={!!rejectingUser} onOpenChange={(open) => !open && setRejectingUser(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject signup request</DialogTitle>
                      <DialogDescription>
                        Reject {rejectingUser?.name}? They will be removed and can sign up again later if needed.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRejectingUser(null)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleRejectUser} disabled={!!pendingActionId}>
                        {pendingActionId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Reject
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const perms = user.permissions || {}
                        const activeCount = PERM_CATEGORIES.filter(c => perms[c.id] && perms[c.id] !== 'no').length
                        return (
                        <TableRow key={user.id || user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => openPermDialog(user)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              title="Manage permissions"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              {user.role === 'ADMIN' ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">Full Access</span>
                              ) : (
                                <span>{activeCount}/{PERM_CATEGORIES.length} active</span>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user)
                                  setUserForm({
                                    id: user.id || user._id,
                                    firstName: user.firstName || user.name.split(' ')[0] || '',
                                    lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
                                    email: user.email,
                                    phone: (user as any).phone || '',
                                    password: '',
                                    role: user.role as 'ADMIN' | 'STAFF' | 'DEALER' | 'CUSTOMER',
                                    isActive: user.isActive,
                                  })
                                  setUserDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingUser(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per-User Permissions Dialog */}
        <Dialog open={!!permDialogUser} onOpenChange={(open) => !open && setPermDialogUser(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions — {permDialogUser?.name}
              </DialogTitle>
              <DialogDescription>
                Set access level for each module. "No Access" hides the page from sidebar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {PERM_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <Select
                    value={permDialogData[cat.id] || 'no'}
                    onValueChange={(v) => setPermDialogData(prev => ({ ...prev, [cat.id]: v as PermLevel }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No Access</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="full">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermDialogUser(null)}>Cancel</Button>
              <Button onClick={handleSavePermissions} disabled={savingPerms}>
                {savingPerms ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Style Tab */}
        <TabsContent value="invoice-style">
          <div className="flex gap-0 border rounded-xl overflow-hidden bg-white dark:bg-slate-950 min-h-[700px]">
            {/* Live Preview */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Live Preview</p>
              <InvoiceDocument
                invoice={{
                  invoiceNumber: 'INV-26-0042',
                  customerName: 'John & Sarah Mitchell',
                  sideMark: '123 Maple Street, Austin TX',
                  quoteId: 'QT-0089',
                  createdAt: new Date().toISOString(),
                  dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
                  status: 'Unpaid',
                  subtotal: 2450.00,
                  taxRate: 8.25,
                  taxAmount: 202.13,
                  totalAmount: 2652.13,
                  paidAmount: 0,
                  dueAmount: 2652.13,
                  notes: 'Thank you for choosing us! Please review all measurements before installation.',
                  items: [
                    { productName: 'Roller Shades', category: 'Interior', subcategory: 'Blackout', width: 48, length: 72, quantity: 3, unitPrice: 420.00, totalPrice: 1260.00 },
                    { productName: 'Zebra Blinds', category: 'Interior', subcategory: 'Light Filter', width: 36, length: 60, quantity: 2, unitPrice: 380.00, totalPrice: 760.00 },
                    { productName: 'Roman Shades', category: 'Interior', subcategory: 'Classic', width: 42, length: 54, quantity: 1, unitPrice: 430.00, totalPrice: 430.00 },
                  ],
                }}
                config={invoiceConfig}
              />
            </div>

            {/* Customizer Panel */}
            <div className="w-72 flex-shrink-0 border-l border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <InvoiceCustomizerPanel />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Button className="w-full" onClick={saveInvoiceStyle} disabled={invoiceStyleSaving}>
                  {invoiceStyleSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Save Invoice Style</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Dealers &amp; customers will see this style
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Templates</CardTitle>
              <CardDescription>
                Manage agreement templates for different product types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contractTemplates.map((contract) => (
                  <Card key={contract.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contract.name}</p>
                          <p className="text-sm text-muted-foreground">Type: {contract.type}</p>
                          {contractContents[contract.id] && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Content saved</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedContract(contract.id)
                              setEditingContractContent(contractContents[contract.id] || '')
                              setContractDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Library Tab */}
        <TabsContent value="help-library" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Help Library Management</CardTitle>
                  <CardDescription>
                    Manage help resources for customer portal (PDFs, videos)
                  </CardDescription>
                </div>
                <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Help Resource</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={helpForm.title}
                          onChange={(e) => setHelpForm({ ...helpForm, title: e.target.value })}
                          placeholder="Resource title"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={helpForm.type} onValueChange={(v) => setHelpForm({ ...helpForm, type: v as 'PDF' | 'Video' })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="Video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={helpForm.category}
                          onChange={(e) => setHelpForm({ ...helpForm, category: e.target.value })}
                          placeholder="e.g., Getting Started, Operation"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={helpForm.description}
                          onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })}
                          rows={3}
                          placeholder="Resource description"
                        />
                      </div>
                      <div>
                        <Label>Upload File</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept={helpForm.type === 'PDF' ? '.pdf' : 'video/*'}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setHelpForm({ ...helpForm, file })
                            }}
                          />
                        </div>
                        {helpForm.type === 'Video' && (
                          <div className="mt-2">
                            <Label>Or Video URL</Label>
                            <Input
                              value={helpForm.url}
                              onChange={(e) => setHelpForm({ ...helpForm, url: e.target.value })}
                              placeholder="https://youtube.com/..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setHelpDialogOpen(false)}
                        disabled={helpAddingLoading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddHelpItem} disabled={helpAddingLoading}>
                        {helpAddingLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Resource'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {helpLibraryItemsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading help items...
                        </TableCell>
                      </TableRow>
                    ) : helpLibraryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No help items found. Add your first resource above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      helpLibraryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {item.type === 'PDF' ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteHelpItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Care & Maintenance Tab */}
        <TabsContent value="care-maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Care & Maintenance Management</CardTitle>
                  <CardDescription>
                    Manage care and maintenance resources for customer portal (PDFs, videos)
                  </CardDescription>
                </div>
                <Dialog open={careDialogOpen} onOpenChange={setCareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Care Resource</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={careForm.title}
                          onChange={(e) => setCareForm({ ...careForm, title: e.target.value })}
                          placeholder="Resource title"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={careForm.type} onValueChange={(v) => setCareForm({ ...careForm, type: v as 'PDF' | 'Video' })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="Video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={careForm.category}
                          onChange={(e) => setCareForm({ ...careForm, category: e.target.value })}
                          placeholder="e.g., Cleaning, Maintenance"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={careForm.description}
                          onChange={(e) => setCareForm({ ...careForm, description: e.target.value })}
                          rows={3}
                          placeholder="Resource description"
                        />
                      </div>
                      <div>
                        <Label>Upload File</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept={careForm.type === 'PDF' ? '.pdf' : 'video/*'}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setCareForm({ ...careForm, file })
                            }}
                          />
                        </div>
                        {careForm.type === 'Video' && (
                          <div className="mt-2">
                            <Label>Or Video URL</Label>
                            <Input
                              value={careForm.url}
                              onChange={(e) => setCareForm({ ...careForm, url: e.target.value })}
                              placeholder="https://youtube.com/..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setCareDialogOpen(false)}
                        disabled={careAddingLoading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddCareItem} disabled={careAddingLoading}>
                        {careAddingLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Resource'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careItemsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading care items...
                        </TableCell>
                      </TableRow>
                    ) : careItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No care items found. Add your first resource above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      careItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {item.type === 'PDF' ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCareItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shadeotech Address
                  </CardTitle>
                  <CardDescription>
                    Company address used as the origin for commute time in the calendar and customer pages.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-address">Company address</Label>
                  {companyAddressLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </div>
                  ) : (
                    <AddressAutocomplete
                      id="company-address"
                      value={companyAddress}
                      onChange={setCompanyAddress}
                      onSelect={(sel: AddressSelection) => setCompanyAddress(sel.fullAddress)}
                      placeholder="e.g. 3235 Skylane Dr. Unit 111, Carrollton, TX 75006"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    
                  </p>
                </div>
                <Button
                  onClick={saveCompanyAddress}
                  disabled={companyAddressLoading || companyAddressSaving}
                >
                  {companyAddressSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save address
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    View system activity and changes made by users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading audit logs…
                          </TableCell>
                        </TableRow>
                      ) : auditLogsError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-destructive">
                            {auditLogsError}
                          </TableCell>
                        </TableRow>
                      ) : auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No audit log entries yet. Activity from orders, quotes, tasks, and expenses will appear here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((entry, idx) => {
                          const ts = entry.timestamp ? new Date(entry.timestamp) : null
                          const timeStr = ts
                            ? `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}:${String(ts.getSeconds()).padStart(2, '0')}`
                            : '—'
                          const badgeVariant =
                            entry.actionBadge === 'CREATE'
                              ? 'default'
                              : entry.actionBadge === 'DELETE'
                                ? 'destructive'
                                : entry.actionBadge === 'VIEW'
                                  ? 'outline'
                                  : 'secondary'
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">{timeStr}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{entry.userName}</div>
                                  {entry.userEmail && (
                                    <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badgeVariant}>{entry.actionBadge}</Badge>
                              </TableCell>
                              <TableCell>{entry.entityType}</TableCell>
                              <TableCell className="font-mono text-sm">{entry.entityId}</TableCell>
                              <TableCell className="text-sm">{entry.details}</TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Number Format Migration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Number Format Migration</CardTitle>
              <CardDescription>
                Convert existing invoice, estimate, and contract numbers from 4-digit year (INV-2026-0001) to 2-digit year (INV-26-0001). Safe to run multiple times.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button variant="outline" onClick={runNumberMigration} disabled={migratingNumbers}>
                {migratingNumbers ? 'Running…' : 'Run Migration'}
              </Button>
              {numberMigrateResult && (
                <p className="text-sm text-muted-foreground">{numberMigrateResult}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Options Tab */}
        <TabsContent value="quote-options" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Estimate Builder Options
              </CardTitle>
              <CardDescription>
                Customize dropdown values and per-product field visibility in the estimate builder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteOptionsSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Booking Settings
              </CardTitle>
              <CardDescription>
                Control online booking availability, appointment windows, and buffer time between appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="booking-buffer">Buffer Between Appointments (hours)</Label>
                  <p className="text-xs text-muted-foreground">Time required between the end of one appointment and the start of the next.</p>
                  <Input
                    id="booking-buffer"
                    type="number"
                    min={0}
                    max={8}
                    value={bookingBuffer}
                    onChange={(e) => setBookingBuffer(Number(e.target.value))}
                    className="max-w-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-start">First Slot (hour, 0–23)</Label>
                  <p className="text-xs text-muted-foreground">Earliest appointment start time. Default: 10 (= 10 AM).</p>
                  <Input
                    id="booking-start"
                    type="number"
                    min={6}
                    max={14}
                    value={bookingStartHour}
                    onChange={(e) => setBookingStartHour(Number(e.target.value))}
                    className="max-w-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-last">Last Slot (hour, 0–23)</Label>
                  <p className="text-xs text-muted-foreground">Latest appointment start time. Default: 15 (= 3 PM). Later times require a manual request.</p>
                  <Input
                    id="booking-last"
                    type="number"
                    min={10}
                    max={20}
                    value={bookingLastSlotHour}
                    onChange={(e) => setBookingLastSlotHour(Number(e.target.value))}
                    className="max-w-[100px]"
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border text-sm text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Current schedule:</strong> {bookingStartHour}:00 – {bookingLastSlotHour}:00 · {bookingBuffer}h buffer between appointments</p>
                <p>Clients who need a time outside these hours will be prompted to submit a request, which requires admin approval.</p>
              </div>
              <Button onClick={saveBookingSettings} disabled={bookingSettingsSaving} className="bg-amber-600 hover:bg-amber-700 text-white">
                {bookingSettingsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Booking Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket-subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Ticket Subject Options
              </CardTitle>
              <CardDescription>
                Manage the dropdown options available when creating a new support ticket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new subject..."
                  value={newTicketSubjectInput}
                  onChange={(e) => setNewTicketSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTicketSubjectInput.trim()) {
                      const updated = [...ticketSubjects, newTicketSubjectInput.trim()]
                      setTicketSubjects(updated)
                      setNewTicketSubjectInput('')
                    }
                  }}
                  className="max-w-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!newTicketSubjectInput.trim()) return
                    const updated = [...ticketSubjects, newTicketSubjectInput.trim()]
                    setTicketSubjects(updated)
                    setNewTicketSubjectInput('')
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {ticketSubjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>{subject}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setTicketSubjects(ticketSubjects.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => saveTicketSubjects(ticketSubjects)}
                disabled={ticketSubjectsSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {ticketSubjectsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Subjects
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Agreement Dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Agreement Template – {contractTemplates.find(c => c.id === selectedContract)?.name}
            </DialogTitle>
            <DialogDescription>
              Preview shows the formatted agreement. Use the Edit tab to modify content.
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">
                  <FileText className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Content
                </TabsTrigger>
              </TabsList>

              {/* ── PREVIEW TAB ── */}
              <TabsContent value="preview">
                <div className="rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
                  {/* Page 1 */}
                  <div className="px-12 pt-10 pb-8" style={{ fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: '1.65', color: '#111' }}>

                    {/* Logo centered */}
                    <div className="flex justify-center mb-6">
                      <img
                        src="/images/Gemini_Generated_Image_mthqhkmthqhkmthq.png"
                        alt="Shadeotech Logo"
                        className="h-20 object-contain"
                      />
                    </div>

                    {/* Intro heading */}
                    <p className="font-bold mb-3" style={{ fontSize: '14px' }}>Thank You for Choosing Shadeotech!</p>
                    <p className="mb-4 text-justify">
                      We truly appreciate your business and the opportunity to serve you. At Shadeotech, we believe in
                      transparency, we hate surprises as much as you do. Please take a moment to carefully review the
                      following agreement to ensure everything goes smoothly with your project. Please review the estimate
                      thoroughly to ensure the accuracy of the selected fabric model number and details such as mount type,
                      motor, window style, and cord specifications. Changes or refunds are not permitted after the order has
                      been approved and placed. The client acknowledges that they have thoroughly reviewed the quote and
                      confirmed that all information is correct. Any modifications requested after order approval must be
                      submitted in writing and may require a revised invoice, updated timeline, and additional charges.
                    </p>

                    {/* Section: Payment Terms */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Payment Terms </span>
                      To initiate the manufacturing process, a down payment equal to fifty percent (50%) of the total
                      purchase price is required. This payment is due upon order placement. The remaining balance must be
                      paid in full prior to the delivery or installation of the products. Payments can be made via check,
                      Zelle transfer, or credit card. Payments via check should be made out to "SHADEOTECH." Zelle
                      transfers should be directed to info@shadeotech.com. Please note that payments made by credit card
                      will incur a surcharge of three percent (3%) of the total transaction amount. Financing will incur a
                      ten percent (10%) charge that the financing provider charges on top of the invoice total. All sales
                      are final and non-refundable. By placing an order, the client agrees that they have reviewed and
                      accepted all product specifications, designs, and dimensions. SHADEOTECH is not liable for any
                      discrepancies once the order has been confirmed by the client. The client agrees that any disputes
                      regarding payment will be resolved amicably and in good faith between both parties. However, the
                      client also agrees to waive their right to withhold payment or initiate a chargeback or payment
                      dispute with their bank or credit card provider. Failure to adhere to the agreed payment terms may
                      result in legal action to recover the outstanding balance, including any additional costs incurred by
                      SHADEOTECH in the process of collection, including but not limited to legal fees. If a client places
                      an order that requires multiple phases and multiple invoices, any unpaid invoices will void the
                      warranty on all products and services provided. Additionally, no installation will occur until all
                      balances are settled in full. This payment is due upon order placement. The remaining balance must be
                      paid in full prior to the delivery or installation of the products.
                    </p>
                    <p className="mb-4 text-justify italic">
                      I understand that my balance must be paid in full prior to the scheduled installation date. If full
                      payment is not received before installation, a late fee of $75 per day will apply until the outstanding
                      balance is settled. If I have proceeded with financing, I acknowledge that the financing provider
                      operates under its own terms and conditions. I further understand that all of Shadeotech's approved
                      financing providers apply a 10% financing fee, which is separate from and in addition to any fees or
                      terms provided by the financing company.
                    </p>

                    {/* Multiple Invoices */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Multiple Invoices </span>
                      For projects with multiple invoices—such as different phases for interior and exterior installations or
                      sections broken into multiple parts—you must settle the balance for each phase before we can proceed
                      to the next stage. We reserve the right to not proceed with subsequent phases if your previous
                      payments were late.
                    </p>

                    {/* Late Payment */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Late Payment </span>
                      If the full payment is not made by the time of installation, a late payment fee of $75 per day will be
                      applied starting from the date of installation until the outstanding balance is settled in full. The
                      customer acknowledges and agrees that the company reserves the right to withhold services or delay
                      installation until the balance is cleared. Additionally, if there is any outstanding balance after the
                      installation is complete, the warranty will be void. If any invoice remains unpaid beyond the due date
                      and Shadeotech is required to initiate collection efforts, the client agrees to be responsible for all
                      costs associated with the recovery of the outstanding balance. This includes, but is not limited to,
                      collection agency fees, attorney fees, court costs, and interest on the unpaid balance at the maximum
                      rate permitted by Texas law. These fees will be added to the total amount due and are enforceable
                      under this agreement.
                    </p>

                    {/* Electrical Work */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Electrical Work </span>
                      Any electrical work required for the installation or operation of Shadeotech products is the sole
                      responsibility of the client. Shadeotech does not perform electrical work and is not licensed or
                      authorized to do so. We are not liable for any damages, malfunctions, or safety issues resulting from
                      electrical work performed by a third-party electrician or by the client themselves. We have no control
                      over the color of wires provided with motors or chargers, as these are standard from the manufacturer
                      and cannot be customized. Shadeotech does not paint or alter any electrical components. If a client
                      chooses to use an extension cord or any alternative power setup that does not involve directly
                      plugging the shade into a standard outlet, all responsibility for performance, safety, and compliance
                      lies with the homeowner. All costs related to third-party electrical services are the sole
                      responsibility of the client, and Shadeotech shall not be held liable for any issues arising from
                      such services.
                    </p>

                    {/* Aluminum Components */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Aluminum Components </span>
                      {(selectedContract === 'contract_1' || selectedContract === 'contract_3')
                        ? <>By default, roller shades will come with a steel beaded chain. If you prefer a white or black plastic chain, you must specify this at the time of ordering. However, we do not recommend plastic chains as they are less durable. All other shades will have color-coordinated cords. Both chains and cords are custom-cut to match the length of each window for a precise fit. By law, all chains and cords must be securely screwed to the wall for safety compliance. If you choose not to have them secured, you may sign a waiver acknowledging the risks.</>
                        : <>By default, all components will be color-coordinated with the closest available color to the selected fabric. If a specific color is desired, it must be specified at the time of consultation. Once an order has been placed, we are unable to make any changes.</>
                      }
                    </p>

                    {/* Solar Panel */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Solar Panel Obstruction Policy </span>
                      If any obstruction (e.g., furniture, fixtures, new construction, landscaping, screens, or structural
                      changes) appears in front of a solar panel after installation, and repositioning is required, a trip
                      charge will apply to move the solar panel to an alternative position. Additionally, the Customer
                      acknowledges that solar-powered motors rely entirely on adequate sunlight exposure to maintain battery
                      charge. Shadeotech is not responsible for reduced performance or charging issues caused by
                      insufficient sunlight, improper panel orientation, shaded window placement, weather conditions, or
                      seasonal changes in sun intensity and angle. Shadeotech does not control the availability of sunlight
                      or environmental conditions affecting solar charging.
                    </p>

                    {selectedContract === 'contract_2' && (
                    /* Exterior Shades */
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Exterior Shades </span>
                      Exterior shades require a flat surface for the track to be installed. If the surface has stonework,
                      Shadeotech may need to shave or fill gaps with foam for proper installation. Shadeotech is not
                      responsible for any resulting aesthetic issues or modifications required to accommodate installation.
                      Patios are often sloped for drainage purposes; as a result, Shadeotech is not responsible if the
                      bottom of the shade does not provide complete coverage. If an exterior shade is installed in a way
                      that deviates from Shadeotech's professional recommendations, or if exterior shades are left down
                      during extreme weather conditions, such as high winds, freezing rain, hail, or any weather conditions
                      that trigger official weather alerts, and the zipper or other components become damaged, SHADEOTECH
                      will not be responsible, and the warranty will not cover the repairs or replacements. Shadeotech is
                      not responsible for any resulting issues, including but not limited to shade malfunction, improper
                      function, or detachment. Any warranty for such installations will be void.
                    </p>
                    )}

                    {/* Smart Hub */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Smart Hub &amp; Timer Configuration </span>
                      For security reasons, Shadeotech will not program or configure any smart hubs that are connected to a
                      customer's WiFi network. Customers are responsible for programming and managing their own smart hubs
                      to ensure the security of their network and devices. If the client has a remote with a timer function,
                      Shadeotech will not configure the timer. Shadeotech is not responsible for any issues, disruptions,
                      malfunctions, or loss of functionality caused by third-party applications, firmware updates,
                      platform outages, WiFi/router changes, or compatibility limitations. This includes, but is not limited
                      to, apps such as Bond, Somfy, Tuya, Amazon Alexa, Google Home, Apple HomeKit, or any other external
                      smart control system. If the Customer experiences problems related to a third-party app or smart
                      platform, the Customer agrees that they must contact the third-party provider directly for
                      troubleshooting and support. Shadeotech shall not be liable for service calls, reprogramming, or
                      operational issues arising from third-party software or systems outside of Shadeotech's control.
                    </p>

                    {/* Remote & Programming */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Remote &amp; Programming Policy </span>
                      If a remote is damaged, dropped, exposed to moisture, or tampered with in any way, including
                      alterations to the programming, the product warranty will be void. This includes any instances where
                      the client opens the shade motor housing, interferes with wiring, or attempts reprogramming without
                      Shadeotech's guidance. Clients are advised not to make any changes to the remote settings or motor
                      configurations after installation. Any service required to correct issues caused by such tampering
                      will incur a trip charge starting at $125, plus the cost of repair or replacement.
                    </p>

                    {(selectedContract === 'contract_1' || selectedContract === 'contract_3') && (
                    /* Battery Maintenance */
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Battery Maintenance Requirement </span>
                      The Client agrees to charge each rechargeable battery motor using the charger provided by Shadeotech at least once every six (6) months, regardless of whether the motor has been in use. This requirement is necessary to maintain optimal battery health and performance. Failure to follow this maintenance requirement may void the warranty on the motor and battery.
                    </p>
                    )}

                    {/* Timeline */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Timeline </span>
                      The delivery timeframe for your shades can range from 2 days to 8 weeks, depending on the product and
                      fabric selected, or as indicated by your consultant. While we strive to complete deliveries within
                      4 weeks from acceptance of the contract and initial payment, unforeseen circumstances may
                      occasionally lead to delays. Shadeotech shall not be held liable for delays in product delivery due
                      to circumstances beyond its control, including but not limited to, natural disasters, transportation
                      disruptions, or supplier delays.
                    </p>

                    {/* Warranty */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Warranty </span>
                      We offer a limited lifetime warranty on our products, which means your warranty is valid as long as
                      you reside in your house. Warranty registration is required on our website at{' '}
                      <span className="text-blue-600 underline">https://shadeotech.com/warranty-registration/</span>.
                      Warranty registrations must be completed within 30 days of installation. Motors have a 5-year
                      warranty{selectedContract === 'contract_2' && ', and the exterior Zip-Track has its own warranty'}. For any issues, contact us via phone or
                      our website. This warranty excludes conditions from accidents, misuse, or neglect. If there is any
                      outstanding balance after the installation is complete, the warranty will be void. If a motor is
                      charged with any charger other than the one provided by Shadeotech, the warranty will be void due to
                      variations in wattage that may cause damage. Warranty does not cover damage caused by extreme weather
                      or natural events.
                    </p>

                    {/* Trip Charge */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Trip Charge Policy </span>
                      A trip charge starting at $125 will apply for all service visits, including warranty claims,
                      non-warranty repairs, or adjustments caused by factors outside of Shadeotech's control. This
                      includes, but is not limited to, issues resulting from user error, damage, third-party interference,
                      environmental factors, or changes to the home that affect shade operation after installation.
                      Warranty claims still require a technician visit to evaluate and resolve the issue, and the trip
                      charge applies in all cases. If additional site visits are required for further measurements,
                      consultations, or confirmation beyond the initial visit, a service fee will apply per visit. This
                      includes revisits due to client-requested changes, access issues, or site unpreparedness. The
                      customer is responsible for obtaining any required HOA approvals or permits. Shadeotech is not liable
                      for violations or removal requests.
                    </p>

                    {selectedContract === 'contract_2' && (
                    /* Wall and Slope */
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Wall and Slope Deviations </span>
                      Patio walls and floors are often uneven or sloped, which may cause one side to sit higher than the
                      other. As a result, fabric may not hang perfectly straight. Shadeotech is not responsible for these
                      deviations, as they are inherent to the structure. During installation, we may make small alterations
                      such as shaving edges or notching wood to allow proper fitting. Any work beyond minor adjustments
                      (including masonry or structural modifications) is the sole responsibility of the client and not
                      included in Shadeotech's services.
                    </p>
                    )}

                    {(selectedContract === 'contract_1' || selectedContract === 'contract_3') && (
                    <>
                    {/* High Ceiling(s) */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">High Ceiling(s) </span>
                      Measuring high ceiling windows is challenging. Our technicians take utmost care during measurement, but a margin of error of ±1 inches might occur. Adjustments will be made during installation if necessary.
                    </p>
                    {/* Fabric Wrapping */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Fabric Wrapping Disclaimer </span>
                      We do not recommend fabric wrapping the cassette or bottom rail. The client acknowledges that if dust or dirt gets into the crevices or if the tape wears off, it will not be covered by warranty. A replacement can be done at an additional charge.
                    </p>
                    {/* Window Deviation */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Window Deviation and Workaround </span>
                      Windows may deviate slightly, with differences up to 1in. Our shades are precisely crafted; however, window deviations may cause a slight angle at the bottom. We recommend installing without spacers to minimize visibility of deviations, though spacers can be used to level the window if necessary. Shadeotech is not responsible for any inherent flaws in window construction.
                    </p>
                    </>
                    )}

                    {/* Client Measurements */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Client-Provided Measurements Disclaimer: </span>
                      If the Customer chooses to provide their own measurements instead of having Shadeotech measure the
                      windows, the Customer assumes full responsibility for the accuracy of all dimensions submitted for
                      manufacturing. Shadeotech will manufacture products strictly according to the measurements provided
                      by the Customer. Because all products are custom-made, Shadeotech is not responsible for errors,
                      improper fit, or performance issues resulting from incorrect or incomplete measurements supplied by
                      the Customer. If a remake, adjustment, or replacement is required due to measurement inaccuracies,
                      the Customer agrees that all associated costs will be the Customer's responsibility. This includes,
                      but is not limited to, remanufacturing fees, material costs, shipping, and additional service or
                      installation charges.
                    </p>

                    {/* Gaps */}
                    <p className="mb-4 text-justify">
                      <span className="font-bold">Gaps </span>
                      {(selectedContract === 'contract_1' || selectedContract === 'contract_3')
                        ? <>Blinds and shades may have small gaps to prevent damage during operation. These gaps do not allow detailed visibility from outside but might show light and movement. For enhanced light control and privacy, you may opt to add a side channel track that gets installed on either side of the blinds or shades. The client acknowledges that walls are not always perfectly straight. Shadeotech shades are cut by a precision machine and are perfectly straight when manufactured. If any slopes or gaps appear on any side after installation, it is due to wall irregularities and not a defect in the product. Shadeotech is not responsible for any aesthetic concerns caused by wall unevenness.</>
                        : <>If the surfaces where side tracks are installed are not straight, small gaps may appear along the edges. In such cases, we may use foam or filler to reduce visibility of gaps. These adjustments are functional solutions, but complete elimination of gaps cannot be guaranteed. Shadeotech is not responsible for aesthetic concerns arising from wall or surface irregularities.</>
                      }
                    </p>

                    {/* Installation and Site Preparation */}
                    <p className="mb-6 text-justify">
                      <span className="font-bold">Installation and Site Preparation </span>
                      The client is responsible for ensuring that the installation site is clear and ready for
                      Shadeotech's employees and subcontractors to perform their work. This includes ensuring that the
                      path to the installation area is unobstructed and that any furniture, valuables, or other items are
                      moved out of the way prior to the scheduled installation time. Shadeotech and its employees are not
                      permitted to move or handle any of the client's belongings. The client agrees that Shadeotech is not
                      liable for any damages to the client's property, including but not limited to furniture, valuables,
                      or any other items, resulting from the installation process. The client assumes full responsibility
                      for any loss or damage that may occur due to the client's failure to adequately prepare the site.
                      The client understands that during installation, walls, window trims, and window sills may incur
                      damage. Shadeotech is not responsible for failures due to mounting into structurally unsound or
                      non-standard surfaces. The client releases Shadeotech from liability, and Shadeotech is not
                      responsible for any damage that may occur. Shadeotech shall not be liable for any damages, injuries,
                      or losses arising from the installation, use, or operation of its products. The client assumes full
                      responsibility for ensuring proper maintenance, use, and operation. Shadeotech makes no guarantees
                      regarding installation in non-recommended settings and voids any warranty for installations that do
                      not follow professional recommendations. If the client is not present for the scheduled installation,
                      the Shadeotech team will wait for 15 minutes. After this period, the client will need to reschedule
                      and pay an additional service charge. If blind removal is required before installation, the client
                      acknowledges that there will be a fee for the removal and disposal.
                    </p>

                    {/* Numbered Terms */}
                    <ol className="list-decimal list-outside pl-6 space-y-3 mb-6">
                      <li className="text-justify">
                        <span className="font-bold">Definitions </span>
                        "Company" refers to Shadeotech Inc. "Customer" means the purchaser of goods and/or services from
                        the Company. "Goods" refer to all products sold, customized, and/or installed by the Company.
                        "Terms" refer to the Terms and Conditions set forth in this agreement.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Cancellation &amp; Refunds </span>
                        Once a deposit has been received and the order placed into production, the order is non-cancelable
                        and non-refundable. Shadeotech reserves the right to reject any cancellation or modification
                        request after order confirmation. If exceptions are made, additional charges may apply at
                        Shadeotech's sole discretion.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Ownership &amp; Risk Transfer </span>
                        Title to the Goods remains with Shadeotech until full payment is received. Risk of loss or damage
                        to Goods passes to the Customer upon delivery or installation. Customers are responsible for
                        safeguarding installed products from that moment forward.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Photo Consent for Marketing </span>
                        Customer acknowledges and agrees that Shadeotech may take before-and-after photographs of the
                        installation site strictly for use in portfolio, training, and marketing purposes including social
                        media. No personal information including names, addresses, or any identifying details will be
                        disclosed. Customer may opt-out in writing before installation if they do not wish for photos of
                        their property to be used.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Final Customization Confirmation </span>
                        All orders are custom-made. Once materials are approved and production begins, no changes may be
                        made to design, fabric, mount type, or motorization. If the client is dissatisfied with their
                        custom selection post-installation, modifications can be made for an additional charge. Shadeotech
                        is not responsible for client remorse or preference change after manufacturing has begun.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Inspection </span>
                        Customer must inspect installed products immediately. Any issues or discrepancies must be reported
                        to Shadeotech in writing within 24 hours of installation. After this window, all products will be
                        deemed accepted in full working condition.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Force Majeure </span>
                        The Company shall not be liable for any failure to perform its obligations where such failure
                        results from any cause beyond the Company's reasonable control, including but not limited to
                        natural disasters, labor disputes, delays by suppliers, or government actions.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Severability </span>
                        If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions
                        shall remain in full force and effect.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Waiver </span>
                        Failure by the Company to enforce any provision of these Terms shall not be construed as a waiver
                        of any provision or right.
                      </li>
                      <li className="text-justify">
                        <span className="font-bold">Governing Law </span>
                        This agreement shall be governed by and construed in accordance with the laws of the State of
                        Texas. Any disputes arising under this agreement shall be subject to the exclusive jurisdiction of
                        the courts located in Texas.
                      </li>
                    </ol>

                    {/* Acknowledgment */}
                    <p className="mb-8 text-justify">
                      <span className="font-bold">Acknowledgment </span>
                      By signing below, I hereby acknowledge that I have read, understood, and agree to be bound by the
                      above terms and conditions. I also confirm that I have reviewed the quote and all the provided
                      information is accurate and correct.
                    </p>

                    {/* Signature Block */}
                    <div className="grid grid-cols-2 gap-12 mt-2">
                      <div>
                        <div className="border-b border-gray-800 mb-1" style={{ height: '28px' }} />
                        <p style={{ fontSize: '12px' }}>Full Name</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-800 mb-1" style={{ height: '28px' }} />
                        <p style={{ fontSize: '12px' }}>Address of Installation Site</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-800 mb-1" style={{ height: '28px' }} />
                        <p style={{ fontSize: '12px' }}>Signature</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-800 mb-1" style={{ height: '28px' }} />
                        <p style={{ fontSize: '12px' }}>Date</p>
                      </div>
                    </div>

                  </div>{/* end page */}
                </div>
              </TabsContent>

              {/* ── EDIT TAB ── */}
              <TabsContent value="edit">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Use <code className="rounded bg-muted px-1 text-xs">[CUSTOMER_NAME]</code> as a placeholder — it will be replaced when the agreement is sent.
                    {' '}Insert <code className="rounded bg-muted px-1 text-xs">[SECTION_BREAK]</code> on its own line to split the agreement into separate signing pages in the customer portal.
                  </p>
                  <Textarea
                    rows={28}
                    className="font-mono text-xs leading-relaxed"
                    value={editingContractContent}
                    onChange={(e) => setEditingContractContent(e.target.value)}
                    placeholder="Enter agreement content here."
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setContractDialogOpen(false)
              setEditingContractContent('')
            }}>Close</Button>
            <Button onClick={async () => {
              if (selectedContract) {
                const nextContents = {
                  ...contractContents,
                  [selectedContract]: editingContractContent,
                }
                const saved = await saveContractTemplates(nextContents)
                if (!saved) return
                toast({ title: 'Saved', description: `${contractTemplates.find(c => c.id === selectedContract)?.name} agreement template saved.` })
              }
              setContractDialogOpen(false)
              setEditingContractContent('')
            }}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
