'use client'

import dynamic from 'next/dynamic'

const VenueMap = dynamic(() => import('@/components/VenueMap'), { ssr: false })

export { VenueMap as VenueMapDynamic }
