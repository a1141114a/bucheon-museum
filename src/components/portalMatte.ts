/** Remove only dark video background connected to its edges, preserving enclosed
 * dark details in the doorway. The supplied gate outline is static. */
export function portalAlphaMatte(width:number,height:number,pixels:Uint8ClampedArray){
 const count=width*height,outside=new Uint8Array(count),dark=new Uint8Array(count),queue=new Int32Array(count)
 for(let i=0;i<count;i++)dark[i]=Number(Math.max(pixels[i*4],pixels[i*4+1],pixels[i*4+2])<90)
 let head=0,tail=0
 const visit=(i:number)=>{if(!outside[i]&&dark[i]){outside[i]=1;queue[tail++]=i}}
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x)}
 for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1)}
 while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);if(x>0)visit(i-1);if(x+1<width)visit(i+1);if(y>0)visit(i-width);if(y+1<height)visit(i+width)}
 const result=new Uint8ClampedArray(count*4)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let sum=0,samples=0
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height){sum+=1-outside[yy*width+xx];samples++}}
  const i=(y*width+x)*4,a=Math.round(255*sum/samples);result[i]=result[i+1]=result[i+2]=a;result[i+3]=255
 }
 return result
}
