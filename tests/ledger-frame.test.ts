import {describe,it,expect} from 'vitest'
import {fitLedgerFrame,ledgerSource} from '../src/components/ledgerFrame'

describe('artifact frame geometry',()=>{
  it('gives explicit nonzero dimensions inside phone and iPad viewports',()=>{
    for(const [w,h] of [[320,568],[390,844],[768,1024],[1024,768],[1180,820],[1366,1024]]){
      const frame=fitLedgerFrame(w,h)
      expect(frame.width).toBeGreaterThan(0);expect(frame.height).toBeGreaterThan(0)
      expect(frame.width).toBeLessThan(w);expect(frame.height).toBeLessThan(h)
      if(frame.portrait)expect(frame.height).toBeGreaterThan(frame.width)
      else expect(frame.width/frame.height).toBeCloseTo(1112/720,8)
    }
  })
  it('inserts static material while retaining both complete original video bands',()=>{
    for(const [w,h] of [[390,844],[1024,768]]){
      const frame=fitLedgerFrame(w,h),scale=frame.width/ledgerSource.width
      const extra=Math.max(0,frame.height-ledgerSource.height*scale)
      const firstHeight=ledgerSource.insertionY,secondHeight=ledgerSource.height-firstHeight
      expect(firstHeight+secondHeight).toBe(720)
      expect(firstHeight*scale+extra+secondHeight*scale).toBeCloseTo(frame.height,8)
      expect(ledgerSource.videoLeft*2+ledgerSource.videoWidth).toBe(1112)
    }
  })
})
