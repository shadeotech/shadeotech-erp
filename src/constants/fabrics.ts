import type { Fabric } from '@/types/fabric'

type FabricSeed = Omit<Fabric, 'id'> & { id: string; pricingCollectionId: string }

export const initialFabricData: FabricSeed[] = [
  // ─── DUO SHADES › LIGHT FILTERING ────────────────────────────────────────
  // Infra collection
  { id: 'duo-lf-infra-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Infra', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-infra-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Infra', color: 'Ivory', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-infra-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Infra', color: 'Mushroom', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-infra-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Infra', color: 'Light Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-infra-5', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Infra', color: 'Light Beige', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Salvus collection
  { id: 'duo-lf-salvus-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Salvus', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-salvus-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Salvus', color: 'Ice Beige', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-salvus-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Salvus', color: 'Light Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-salvus-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Salvus', color: 'Olive Gold', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-salvus-5', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Salvus', color: 'Khaki', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Eternal collection
  { id: 'duo-lf-eternal-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Eternal', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-eternal-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Eternal', color: 'Ivory', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-eternal-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Eternal', color: 'Sand', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-eternal-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Eternal', color: 'Light Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-eternal-5', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Eternal', color: 'Olive Gold', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Luminair collection
  { id: 'duo-lf-luminair-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Luminair', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-luminair-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Luminair', color: 'Ivory', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-luminair-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Luminair', color: 'Wood', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-luminair-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Luminair', color: 'Ink Black', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Lous collection
  { id: 'duo-lf-lous-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Lous', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-lous-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Lous', color: 'Light Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Evermore collection
  { id: 'duo-lf-evermore-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Evermore', color: 'Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-evermore-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Evermore', color: 'Charcoal', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Prose 4 collection
  { id: 'duo-lf-prose4-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Prose 4', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-prose4-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Prose 4', color: 'Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Gio collection
  { id: 'duo-lf-gio-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Gio', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Venice collection
  { id: 'duo-lf-venice-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Venice', color: 'Ivory', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-venice-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Venice', color: 'Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-venice-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Venice', color: 'Dark Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-venice-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Venice', color: 'Khaki', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Shadeo collection (Duo LF)
  { id: 'duo-lf-shadeo-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 510-58', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 519-1', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 510-4', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50013-4', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-5', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 5009-2', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-6', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 824-2', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-7', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH GW-01', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-8', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH GG-02', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-shadeo-9', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 824-1', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Basic collection (uses duo_basic pricing)
  { id: 'duo-lf-basic-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Basic', color: 'SH 14000-58', pricingCollectionId: 'duo_basic', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-basic-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Basic', color: 'SH 14000-63', pricingCollectionId: 'duo_basic', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-basic-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Basic', color: 'SH 14000-2', pricingCollectionId: 'duo_basic', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-basic-4', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Basic', color: 'SH 160-2', pricingCollectionId: 'duo_basic', imageFilename: 'placeholder.jpg' },
  // Folklore collection
  { id: 'duo-lf-folklore-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Folklore', color: 'Mushroom', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-folklore-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Folklore', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Elegie collection
  { id: 'duo-lf-elegie-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Elegie', color: 'White', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-elegie-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Elegie', color: 'Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  // Aurora collection
  { id: 'duo-lf-aurora-1', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Aurora', color: 'Beige', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-aurora-2', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Aurora', color: 'Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'duo-lf-aurora-3', category: 'Duo Shades', subcategory: 'Light Filtering', collection: 'Aurora', color: 'Dark Grey', pricingCollectionId: 'duo_light_filtering', imageFilename: 'placeholder.jpg' },

  // ─── DUO SHADES › ROOM DIMMING ───────────────────────────────────────────
  { id: 'duo-rd-velour-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Velour', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-velour-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Velour', color: 'Ivory', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-velour-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Velour', color: 'Light Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-strados-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Strados', color: 'Mushroom', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-strados-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Strados', color: 'Ivory', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-strados-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Strados', color: 'Beige Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-strados-4', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Strados', color: 'Light Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-prism-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Prism', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-prism-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Prism', color: 'Light Beige', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-prism-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Prism', color: 'Light Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-prism-4', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Prism', color: 'Mushroom', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-prism-5', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Prism', color: 'Wood', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-lyon-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Lyon', color: 'Ivory', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-lyon-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Lyon', color: 'Light Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-swift-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Swift', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-swift-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Swift', color: 'Sand', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-swift-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Swift', color: 'Light Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-shadeo-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH.JL-3071-2', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-shadeo-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH 702-1', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-shadeo-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH 500-2', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-shadeo-4', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH 500-3', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-shadeo-5', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH 702-6', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-florence-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Florence', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-florence-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Florence', color: 'Ivory', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-florence-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Florence', color: 'Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-florence-4', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Florence', color: 'Dark Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-florence-5', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Florence', color: 'Charcoal', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-chalant-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Chalant', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-chalant-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Chalant', color: 'Mushroom', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-chalant-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Chalant', color: 'Dark Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-genova-1', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Genova', color: 'White', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-genova-2', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Genova', color: 'Mushroom', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-genova-3', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Genova', color: 'Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'duo-rd-genova-4', category: 'Duo Shades', subcategory: 'Room Dimming', collection: 'Genova', color: 'Dark Grey', pricingCollectionId: 'duo_room_dimming', imageFilename: 'placeholder.jpg' },

  // ─── ROLLER SHADES › LIGHT FILTERING ─────────────────────────────────────
  { id: 'rl-lf-shadeo-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 94511-1', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50100-5', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50100-1', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50100-2', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50064-T-1', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 50064-T-4', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3090-1', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-8', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3090-3', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-9', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3083-1', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-10', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3083-3', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-11', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 705-3', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-12', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 53-5', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-13', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 53-2', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shadeo-14', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH EKO 50 WHITE', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-linen-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Linen', color: 'White', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-linen-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Linen', color: 'Grey', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-linen-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Linen', color: 'Dark Grey', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-sparkle-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Sparkle', color: 'White', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-sparkle-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Sparkle', color: 'Grey', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  // Solar collections → roller_sun_screen pricing
  { id: 'rl-lf-solar1-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'White', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'White Beige', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'Beige Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'White Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'Black Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'Black Copper', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar1-8', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '1% Solar', color: 'Black', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'White', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'White Beige', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'Beige Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'White Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'Black Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'Black Copper', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar3-8', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '3% Solar', color: 'Black', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'White', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'White Beige', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'Beige Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'White Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'Black Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'Black Copper', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar5-8', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '5% Solar', color: 'Black', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'White', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'White Beige', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'Beige Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'White Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'Black Grey', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'Black Copper', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-solar10-8', category: 'Roller Shades', subcategory: 'Light Filtering', collection: '10% Solar', color: 'Black', pricingCollectionId: 'roller_sun_screen', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-silkbamboo-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Silk Bamboo', color: 'Brightlight 5311', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-silkbamboo-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Silk Bamboo', color: 'Tumbleweed 5312', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-silkbamboo-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Silk Bamboo', color: 'Sand 5313', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-silkbamboo-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Silk Bamboo', color: 'Brownstone 5314', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-silkbamboo-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Silk Bamboo', color: 'Steel 5315', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Snow 1101', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Ivory 1102', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Off White 1103', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Stone 1104', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Coffee 1105', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-geneva-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Geneva', color: 'Silver 1106', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Abbey White 1101', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Hamton Beige 1103', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Tower Taupe 1104', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Black River 1106', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Silver Bridge 1107', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-london-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'London', color: 'Gray Church 1108', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-softlinen-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Soft Linen', color: 'Sandy Beach 001', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-softlinen-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Soft Linen', color: 'Soft Dunes 003', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'White 1101', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'White Gold 1102', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'Gold 1103', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'Gray 1104', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'Silver Black 1105', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-shimmering-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Shimmering', color: 'Black White 1106', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'Burlap Chester 1104', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'United White 1111', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'Beige Wales 1112', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'Foggy Lake 1113', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'Gray Chester 1114', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'York Shadow 1115', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-manchester-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Manchester', color: 'Dark Train 1116', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Dove White 1101', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Dried Khaki 1102', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Sweet Latte 1103', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Tan Wool 1104', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Steel Gray 1105', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Light Charcoal 1106', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-madrid-7', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Madrid', color: 'Dark Cloud 1107', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'White Ice 001', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'Creamy 002', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'Pewter 005', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'Night Train 008', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'Gray Fawn 009', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morelle-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle', color: 'Storm 012', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-1', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'White Ice 001-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-2', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'Creamy 002-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-3', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'Pewter 005-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-4', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'Night Train 008-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-5', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'Gray Fawn 009-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'rl-lf-morellefr-6', category: 'Roller Shades', subcategory: 'Light Filtering', collection: 'Morelle FR', color: 'Storm 012-FR', pricingCollectionId: 'roller_light_filtering', imageFilename: 'placeholder.jpg' },

  // ─── ROLLER SHADES › BLACKOUT ─────────────────────────────────────────────
  { id: 'rl-bo-sunscreen0-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Sunscreen 0%', color: 'White', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-sunscreen0-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Sunscreen 0%', color: 'White Linen', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-sunscreen0-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Sunscreen 0%', color: 'White Pearl', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shadeo-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shadeo', color: 'White', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shadeo-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shadeo', color: 'Sand', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shadeo-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shadeo', color: 'Ash', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shadeo-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shadeo', color: 'Sunset Black', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-rollex-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Rollex', color: 'Off White', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-silkbamboo-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Silk Bamboo', color: 'Brightlight 5301', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-silkbamboo-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Silk Bamboo', color: 'Tumbleweed 5302', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-silkbamboo-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Silk Bamboo', color: 'Sand 5303', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-silkbamboo-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Silk Bamboo', color: 'Brownstone 5304', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-silkbamboo-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Silk Bamboo', color: 'Steel 5305', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Snow 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Ivory 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Off White 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Stone 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Coffee 1905', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-geneva-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Geneva', color: 'Silver 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Abbey White 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Hamton Beige 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Tower Taupe 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Black River 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Silver Bridge 1907', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-london-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'London', color: 'Gray Church 1908', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-softlinen-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Soft Linen', color: 'Sandy Beach 901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-softlinen-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Soft Linen', color: 'Soft Dunes 903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'White 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'White Gold 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'Gold 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'Gray 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'Silver Black 1905', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-shimmering-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Shimmering', color: 'Black White 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'Burlap Chester 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'United White 1911', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'Beige Wales 1912', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'Foggy Lake 1913', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'Gray Chester 1914', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'York Shadow 1915', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-manchester-7', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Manchester', color: 'Dark Train 1916', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-nouveau-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Nouveau', color: 'White 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-nouveau-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Nouveau', color: 'Beige 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-nouveau-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Nouveau', color: 'Tan 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-nouveau-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Nouveau', color: 'Fawn 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-nouveau-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Nouveau', color: 'Monochrome 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'Ivory Cream 6523', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'White Snow 6531', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'Light Sundew 6532', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'Mystic Gray 6539', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'Brown Penny 6540', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-allure-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Allure', color: 'Blacklore 6542', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-galaxy-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Galaxy', color: 'Nova 1900', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-galaxy-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Galaxy', color: 'Halo 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-galaxy-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Galaxy', color: 'Juno 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-galaxy-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Galaxy', color: 'Aries 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-galaxy-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Galaxy', color: 'Eclipse 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'Bright White 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'Light Eggshell 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'Vanilla Shake 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'Light Moca 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'Gray Shadow 1905', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-monticello-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Monticello', color: 'True Black 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Dove White 1901', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Dried Khaki 1902', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Sweet Latte 1903', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Tan Wool 1904', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Steel Gray 1905', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Light Charcoal 1906', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-madrid-7', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Madrid', color: 'Dark Cloud 1907', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'White Ice 6500', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'Creamy 6501', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'Pewter 6512', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'Night Train 6511', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'Gray Fawn 6515', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morelle-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle', color: 'Storm 6518', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-1', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'White Ice 6500-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-2', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'Creamy 6501-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-3', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'Pewter 6512-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-4', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'Night Train 6511-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-5', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'Gray Fawn 6515-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },
  { id: 'rl-bo-morellefr-6', category: 'Roller Shades', subcategory: 'Blackout', collection: 'Morelle FR', color: 'Storm 6518-FR', pricingCollectionId: 'roller_room_darkening', imageFilename: 'placeholder.jpg' },

  // ─── TRI SHADES ───────────────────────────────────────────────────────────
  { id: 'tri-lf-shadeo-1', category: 'Tri Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3074-1', pricingCollectionId: 'tri_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'tri-lf-shadeo-2', category: 'Tri Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3074-4', pricingCollectionId: 'tri_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'tri-lf-shadeo-3', category: 'Tri Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3063-11', pricingCollectionId: 'tri_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'tri-lf-shadeo-4', category: 'Tri Shades', subcategory: 'Light Filtering', collection: 'Shadeo', color: 'SH 3063-12', pricingCollectionId: 'tri_light_filtering', imageFilename: 'placeholder.jpg' },
  { id: 'tri-rd-shadeo-1', category: 'Tri Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH-01 Ivory', pricingCollectionId: 'tri_room_dimming', imageFilename: 'placeholder.jpg' },
  { id: 'tri-rd-shadeo-2', category: 'Tri Shades', subcategory: 'Room Dimming', collection: 'Shadeo', color: 'SH-02 Grey', pricingCollectionId: 'tri_room_dimming', imageFilename: 'placeholder.jpg' },

  // ─── EXTERIOR - ZIP TRACK ─────────────────────────────────────────────────
  { id: 'ext-zip-0', category: 'Exterior - Zip Track', subcategory: '0%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-zip-80', category: 'Exterior - Zip Track', subcategory: '80%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-zip-85', category: 'Exterior - Zip Track', subcategory: '85%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-zip-90', category: 'Exterior - Zip Track', subcategory: '90%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-zip-95', category: 'Exterior - Zip Track', subcategory: '95%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-zip-99', category: 'Exterior - Zip Track', subcategory: '99%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },

  // ─── EXTERIOR - WIRE GUIDE ────────────────────────────────────────────────
  { id: 'ext-wire-0', category: 'Exterior - Wire Guide', subcategory: '0%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },
  { id: 'ext-wire-80', category: 'Exterior - Wire Guide', subcategory: '80%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },
  { id: 'ext-wire-85', category: 'Exterior - Wire Guide', subcategory: '85%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },
  { id: 'ext-wire-90', category: 'Exterior - Wire Guide', subcategory: '90%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },
  { id: 'ext-wire-95', category: 'Exterior - Wire Guide', subcategory: '95%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },
  { id: 'ext-wire-99', category: 'Exterior - Wire Guide', subcategory: '99%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'wire_guide', imageFilename: 'placeholder.jpg' },

  // ─── EXTERIOR - FREE HANG ─────────────────────────────────────────────────
  { id: 'ext-fh-0', category: 'Exterior - Free Hang', subcategory: '0%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-fh-80', category: 'Exterior - Free Hang', subcategory: '80%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-fh-85', category: 'Exterior - Free Hang', subcategory: '85%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-fh-90', category: 'Exterior - Free Hang', subcategory: '90%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-fh-95', category: 'Exterior - Free Hang', subcategory: '95%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
  { id: 'ext-fh-99', category: 'Exterior - Free Hang', subcategory: '99%', collection: 'Standard', color: 'Standard', pricingCollectionId: 'zip', imageFilename: 'placeholder.jpg' },
]

/** Image files present in public/images/fabrics/ — used to match fabric color to image. */
export const FABRIC_IMAGE_FILENAMES: string[] = [
  '1101.png', '1102.png', '1103.png', '1104.png',
  'Abbey_White.png', 'Bark.jpg', 'Basalt.jpg', 'Beige_Wales.png',
  'Blacklore.png', 'Black_Floral.png', 'Black_River.png', 'Bondi.jpg',
  'Brownstone.jpg', 'Brown_Penny.png', 'Burlap_Chester.png', 'Claystone.jpg',
  'Dark_Cloud.png', 'Dark_Train.png', 'Desert.jpg', 'Dove_White.png',
  'Dried_Khaki.png', 'Espresso.jpg', 'Foggy_Lake.png', 'Fossil.jpg',
  'Goldstone.jpg', 'Graphite.jpg', 'Gray_Church.png', 'Greystone.jpg',
  'Grey_Chester.png', 'Hampton_Beige.png', 'Havana.jpg', 'Ice-White.jpg',
  'Ivory.jpg', 'Ivory_Cream.png', 'Java.jpg', 'Light_Charcoal.png',
  'Lite_Sundew.png', 'Mahogany.jpg', 'Mystic_Gray.png', 'Night-Sky.jpg',
  'Nova_1900.png', 'Obsisian.jpg', 'Onyx.jpg', 'Pebble.jpg',
  'Platinum.jpg', 'Sahara.jpg', 'Sand.jpg', 'Silver_Bridge.png',
  'Slate.jpg', 'Snow1101.png', 'Steel_Grey.png', 'Stone_Grey.jpg',
  'Sunrise.jpg', 'Sunset.jpg', 'Sweet_Latte.png', 'Tan_Floral.png',
  'Tan_Wool.png', 'Titan-Grey.jpg', 'Tower_Taupe.png', 'Tungsten.jpg',
  'United_White.png', 'white.jpg', 'White_Floral.png', 'White_Snow.png',
  'York_Shadow.png',
]

export function getImagePath(imageFilename: string): string {
  const name = imageFilename && imageFilename !== 'placeholder.jpg' ? imageFilename : 'white.jpg'
  return `/images/fabrics/${name}`
}

/** Normalize fabric color to filename base (e.g. "White Floral" -> "White_Floral"). */
function colorToBase(color: string): string {
  return color.trim().replace(/\s+/g, '_')
}

/** Find an image filename in FABRIC_IMAGE_FILENAMES that matches the given color. */
export function getImageFilenameForColor(color: string): string | null {
  if (!color || !color.trim()) return null
  const base = colorToBase(color)
  const baseLower = base.toLowerCase()
  // Exact match on filename without extension
  const exact = FABRIC_IMAGE_FILENAMES.find((f) => {
    const name = f.replace(/\.[^.]+$/, '')
    return name === base || name === baseLower
  })
  if (exact) return exact
  // Case-insensitive match
  const match = FABRIC_IMAGE_FILENAMES.find((f) => {
    const name = f.replace(/\.[^.]+$/, '')
    return name.toLowerCase() === baseLower
  })
  return match ?? null
}

/** Resolve fabric to image URL: Cloudinary imageUrl, then imageFilename, then fabric name matched to public/images/fabrics. No fallback. */
export function getFabricImageUrl(fabric: {
  imageUrl?: string | null
  imageFilename: string
  color?: string
}): string | null {
  if (fabric.imageUrl) return fabric.imageUrl
  if (fabric.imageFilename && fabric.imageFilename !== 'placeholder.jpg') {
    return getImagePath(fabric.imageFilename)
  }
  if (fabric.color) {
    const resolved = getImageFilenameForColor(fabric.color)
    if (resolved) return getImagePath(resolved)
  }
  return null
}
