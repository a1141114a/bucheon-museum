export const completionSources={
  1:{width:720,height:800,split:300},
  2:{width:1280,height:672,split:170},
} as const

/** Explicit pixel geometry also works in iPad Safari's native modal layout. */
export function fitCompletion(chapter:1|2,vw:number,vh:number){
  const source=completionSources[chapter]
  const portrait=vw<700&&vh>vw
  const width=Math.max(1,Math.min(chapter===1?620:1100,vw-16,(vh-16)*source.width/source.height))
  const natural=width*source.height/source.width
  const height=Math.min(vh-16,Math.max(natural,chapter===1?Math.min(820,vh-16):portrait?Math.min(650,vh-16):natural))
  const extra=height-natural
  const extended=chapter===2&&extra>60
  const scale=width/source.width
  return {width,height,extended,inset:chapter===1
    ?{top:180*scale,right:118*scale,bottom:160*scale,left:118*scale}
    :extended?{top:Math.max(76,180*scale),right:width*.14,bottom:510*scale,left:width*.14}
    :{top:175*scale,right:310*scale,bottom:285*scale,left:340*scale}}
}
