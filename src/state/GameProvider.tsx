import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { gameReducer, initialState, parseSave, STORAGE_KEY, type Action, type GameState } from './game'
import { translate, type CopyKey } from '../i18n'
const Context=createContext<{state:GameState;dispatch:Dispatch<Action>;storageError:boolean;t:(key:CopyKey)=>string}|null>(null)
export function GameProvider({children}:{children:ReactNode}) {
  const [storageError,setStorageError]=useState(false)
  const [state,dispatch]=useReducer(gameReducer,initialState,()=>{
    try{return parseSave(localStorage.getItem(STORAGE_KEY))}catch{return {...initialState}}
  })
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setStorageError(false)}catch{setStorageError(true)}},[state])
  useEffect(()=>{document.documentElement.lang={zh:'zh-CN',ko:'ko',en:'en'}[state.language];document.title=translate(state.language,'title')},[state.language])
  return <Context.Provider value={{state,dispatch,storageError,t:(key)=>translate(state.language,key)}}>{children}</Context.Provider>
}
export function useGame(){const value=useContext(Context);if(!value)throw new Error('GameProvider missing');return value}
