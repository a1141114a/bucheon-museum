export const joystickDeadZone=.14
export function joystickVector(dx:number,dy:number,radius:number){
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(radius)||radius<=0)
    return {forward:0,side:0,x:0,y:0}
  const distance=Math.hypot(dx,dy)
  if(!distance)return {forward:0,side:0,x:0,y:0}
  const amount=Math.min(1,distance/radius)
  const speed=Math.max(0,(amount-joystickDeadZone)/(1-joystickDeadZone))
  return {forward:speed?-dy/distance*speed:0,side:speed?dx/distance*speed:0,x:dx/distance*amount*radius,y:dy/distance*amount*radius}
}
