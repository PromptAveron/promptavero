export const DEFAULT_HEAD_AD_CODE = `<script>(function(s){s.dataset.zone='12158647',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`

const PREVIOUS_HEAD_AD_CODE = `<script src="https://5gvci.com/act/files/tag.min.js?z=12165667" data-cfasync="false" async></script>`

export function getHeadAdCode(configuredCode?: string | null) {
  if (configuredCode == null) return DEFAULT_HEAD_AD_CODE
  if (!configuredCode.trim()) return ''
  if (configuredCode.trim() === PREVIOUS_HEAD_AD_CODE) return DEFAULT_HEAD_AD_CODE
  return configuredCode
}

export const DEFAULT_PROMPT_BANNER_AD_CODE = `<script>
  atOptions = {
    'key' : 'febbed7f28e37e93038641d872a6483a',
    'format' : 'iframe',
    'height' : 50,
    'width' : 320,
    'params' : {}
  };
</script>
<script src="https://bauval.org/22/febbed7f28e37e93038641d872a6483a"></script>`

export const DEFAULT_PROMPT_CONTAINER_AD_CODE = `<script async="async" data-cfasync="false" src="https://bauval.org/21/f89da9a9f97ffb94ecd3ab1fd38da368"></script>
<div id="container-f89da9a9f97ffb94ecd3ab1fd38da368"></div>`

export function getPromptPageAdCodes(settings: {
  ad_code_prompt_top?: string
  ad_code_prompt_bottom?: string
}) {
  const promptTop = settings.ad_code_prompt_top?.trim()
  const promptBottom = settings.ad_code_prompt_bottom?.trim()

  return {
    belowPrompt: promptTop ?? DEFAULT_PROMPT_CONTAINER_AD_CODE,
    belowImage: promptBottom ?? DEFAULT_PROMPT_BANNER_AD_CODE,
  }
}
