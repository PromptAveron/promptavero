'use client'

import Script from 'next/script'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getPromptPageAdCodes } from '@/lib/ad-code'
import type { PublicSiteSettings } from '@/lib/public-settings'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function PublicIntegrations({
  settings,
  children,
}: {
  settings: PublicSiteSettings
  children: ReactNode
}) {
  const publisherId = settings.adsense_publisher_id
  const analyticsId = settings.google_analytics_id
  const validAnalyticsId = analyticsId && /^G-[A-Z0-9]+$/i.test(analyticsId) ? analyticsId : undefined
  const validPublisherId = publisherId && /^ca-pub-\d{10,20}$/.test(publisherId) ? publisherId : undefined
  const adsEnabled = settings.adsense_enabled === true && Boolean(validPublisherId)
  const analyticsEnabled = Boolean(validAnalyticsId)

  return (
    <>
      {children}
      {analyticsEnabled ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(validAnalyticsId!)}`} strategy="afterInteractive" />
          <Script id="promptavero-google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', ${JSON.stringify(validAnalyticsId)});`}
          </Script>
        </>
      ) : null}
      {adsEnabled ? (
        <Script
          id="promptavero-adsense-loader"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(validPublisherId!)}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          onReady={() => {
            window.dispatchEvent(new Event('promptavero:ads-ready'))
          }}
        />
      ) : null}
    </>
  )
}

export function AdSlot({
  settings,
  kind,
}: {
  settings: PublicSiteSettings
  kind: 'listing' | 'prompt_top' | 'prompt_bottom'
}) {
  const promptPageAds = getPromptPageAdCodes(settings)
  const configuredCode = kind === 'listing'
    ? settings.ad_code_listing
    : kind === 'prompt_top' ? promptPageAds.belowPrompt : promptPageAds.belowImage
  const customCode = configuredCode?.trim() ?? ''
  const publisher = settings.adsense_publisher_id
  const slot = kind === 'listing' ? settings.listing_ad_slot_id : settings.prompt_ad_slot_id
  const validPublisher = publisher && /^ca-pub-\d{10,20}$/.test(publisher) ? publisher : undefined
  const validSlot = slot && /^\d{5,20}$/.test(slot) && kind !== 'prompt_top' ? slot : undefined
  const [ready, setReady] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [frameHeight, setFrameHeight] = useState(280)
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const markReady = () => setReady(true)
    const resize = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.type !== 'promptavero-ad-height') return
      const height = Number(event.data.height)
      if (Number.isFinite(height)) setFrameHeight(Math.max(50, Math.min(1000, height)))
    }
    window.addEventListener('promptavero:ads-ready', markReady)
    window.addEventListener('message', resize)
    if (window.adsbygoogle) setReady(true)
    return () => {
      window.removeEventListener('promptavero:ads-ready', markReady)
      window.removeEventListener('message', resize)
    }
  }, [])

  useEffect(() => {
    if (customCode || !ready || !validPublisher || !validSlot || settings.adsense_enabled !== true || initialized) return
    try {
      window.adsbygoogle = window.adsbygoogle ?? []
      window.adsbygoogle.push({})
      setInitialized(true)
    } catch (error) {
      console.error('Could not initialize the advertising slot.', error)
    }
  }, [customCode, initialized, ready, settings.adsense_enabled, validPublisher, validSlot])

  if (settings.adsense_enabled !== true) return null
  if (!customCode && (!validPublisher || !validSlot)) return null

  return (
    <section className="my-8 w-full text-center" aria-label="Advertisement">
      <h2 className="mb-2 text-xs font-medium text-muted-foreground">Advertisment</h2>
      {customCode ? (
        <iframe
          ref={frameRef}
          title="Advertisement"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
          srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;overflow:hidden}body{display:flex;justify-content:center}</style></head><body>${customCode}<script>new ResizeObserver(()=>parent.postMessage({type:'promptavero-ad-height',height:document.documentElement.scrollHeight},'*')).observe(document.documentElement);</script></body></html>`}
          style={{ height: frameHeight, width: '100%', border: 0, overflow: 'hidden' }}
          className="block"
        />
      ) : (
        <ins
          className="adsbygoogle mx-auto block min-h-24 overflow-hidden rounded-xl bg-muted/40 text-center"
          style={{ display: 'block' }}
          data-ad-client={validPublisher}
          data-ad-slot={validSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
          aria-label="Advertisement"
        />
      )}
    </section>
  )
}
