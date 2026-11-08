export const ledgerSource={width:1112,height:720,videoWidth:960,videoLeft:76,insertionY:210} as const

/** Pixel dimensions avoid Safari dialog/size-containment/aspect-ratio collapse. */
export function fitLedgerFrame(viewportWidth:number,viewportHeight:number) {
  const portrait=viewportWidth<=900&&viewportHeight>=viewportWidth
  const width=Math.max(1,portrait
    ?Math.min(viewportWidth>600?680:440,viewportWidth-16)
    :Math.min(1200,viewportWidth-24,(viewportHeight-24)*ledgerSource.width/ledgerSource.height))
  const height=portrait?Math.max(1,viewportHeight-16):width*ledgerSource.height/ledgerSource.width
  return {width,height,portrait}
}
