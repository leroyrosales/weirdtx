export type Region =
  | 'Panhandle'
  | 'West Texas'
  | 'Hill Country'
  | 'Central Texas'
  | 'DFW'
  | 'East Texas'
  | 'Gulf Coast'
  | 'South Texas'
  | 'Big Bend'

export interface PlaceFrontmatter {
  title: string
  city: string
  region: Region
  lat: number
  lng: number
  tags?: string[]
  featured?: boolean
  teaser?: string
  address?: string
  url?: string
}

export interface EventFrontmatter {
  title: string
  city: string
  region: Region
  lat: number
  lng: number
  starts: string
  ends?: string
  tags?: string[]
  featured?: boolean
  teaser?: string
  url?: string
}

export interface PlaceItem extends PlaceFrontmatter {
  slug: string
  bodyHtml: string
}

export interface EventItem extends EventFrontmatter {
  slug: string
  bodyHtml: string
}

export interface GeoPoint {
  lat: number
  lng: number
}
