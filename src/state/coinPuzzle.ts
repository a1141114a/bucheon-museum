const width=3
export const solvedCoinPuzzle=[1,2,3,4,5,6,7,8,0] as const

export function coinPuzzleNeighbors(index:number):number[] {
  const column=index%width
  const row=Math.floor(index/width)
  return [row>0?index-width:-1,row<width-1?index+width:-1,
    column>0?index-1:-1,column<width-1?index+1:-1].filter(value=>value>=0)
}

export function moveCoinTile(board:readonly number[],index:number):number[]|null {
  const empty=board.indexOf(0)
  if (!coinPuzzleNeighbors(empty).includes(index)) return null
  const next=[...board]
  next[empty]=next[index]
  next[index]=0
  return next
}

export function coinPuzzleSolved(board:readonly number[]):boolean {
  return board.length===solvedCoinPuzzle.length && board.every((value,index)=>value===solvedCoinPuzzle[index])
}

export function createCoinPuzzle(random=Math.random):number[] {
  let board:number[]=[...solvedCoinPuzzle]
  let previous=-1
  for(let step=0;step<15;step++){
    const empty=board.indexOf(0)
    const candidates=coinPuzzleNeighbors(empty).filter(index=>index!==previous)
    const tile=candidates[Math.floor(random()*candidates.length)]
    board=moveCoinTile(board,tile)!
    previous=empty
  }
  return board
}
