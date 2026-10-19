'use client'

import Script from 'next/script'

// Google Analytics 4, on the same property as the other site on this account.
// Both hostnames report into one stream, so segment by hostname in GA4 to tell
// them apart.
//
// Consent starts denied. ConsentBanner asks once and calls
// gtag('consent','update') on Accept; a returning visitor's earlier Accept is
// read from localStorage here, before the GA library runs. Denied-only meant
// GA sent cookieless pings that Google discards at this traffic level, so it
// reported nothing for months. Advertising storage is never granted.
//
// Own visits: open any page once with ?internal=1 and this browser is tagged
// traffic_type=internal from then on (?internal=0 undoes it). GA4's Internal
// Traffic data filter must be set to Active, not Testing, to drop them.
//
// A measurement id is public — it ships in the page source of every site that
// uses one — so it lives in the repo rather than in an environment variable.

const GA4_ID = 'G-8HSXXMY89K'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

export function Analytics() {
  return (
    <>
      {/* Consent defaults must be in the document before the GA library runs,
          or the denial arrives too late to prevent anything. next/script's
          afterInteractive injects client-side, which is too late, so this one
          goes into the HTML directly and ahead of the loader. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;var aa='denied';try{if(localStorage.getItem('aa-consent')==='granted')aa='granted'}catch(e){}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:aa,wait_for_update:500});gtag('js',new Date());var it=false;try{if(/[?&]internal=1/.test(location.search))localStorage.setItem('aa-internal','1');if(/[?&]internal=0/.test(location.search))localStorage.removeItem('aa-internal');it=localStorage.getItem('aa-internal')==='1'}catch(e){}gtag('config',${JSON.stringify(GA4_ID)},it?{anonymize_ip:true,send_page_view:true,traffic_type:'internal'}:{anonymize_ip:true,send_page_view:true});`,
        }}
      />
      <Script
        id="ga4-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />

      {POSTHOG_KEY && (
        <Script id="posthog" strategy="afterInteractive">
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister getFeatureFlag isFeatureEnabled reloadFeatureFlags onFeatureFlags identify setPersonProperties group reset get_distinct_id alias set_config opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(${JSON.stringify(POSTHOG_KEY)},{api_host:${JSON.stringify(POSTHOG_HOST)},person_profiles:'identified_only',capture_pageview:true,persistence:'memory'});`}
        </Script>
      )}
    </>
  )
}
