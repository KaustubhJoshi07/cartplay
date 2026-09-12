import {useEffect,useRef,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {emptyGame,validateGame} from './journey';
const KEY='cartplay.game.v2';
export function useGame() {
  const [game,setGame]=useState(null),[error,setError]=useState(null),[busy,setBusy]=useState(false);
  const current=useRef(null),queue=useRef(Promise.resolve()),pending=useRef(0),mounted=useRef(true);
  const load=async()=>{
    try {const raw=await AsyncStorage.getItem(KEY);const next=raw?validateGame(JSON.parse(raw)):emptyGame();current.current=next;setGame(next);setError(null);}
    catch {setError('Your saved game could not be read. Retry before continuing.');}
  };
  useEffect(()=>{mounted.current=true;load();return()=>{mounted.current=false;};},[]);
  const change=updater=>{
    pending.current++;setBusy(true);
    const operation=queue.current.then(async()=>{
      if(!current.current) throw Error('Game is still loading.');
      const next=updater(current.current);
      await AsyncStorage.setItem(KEY,JSON.stringify(next));
      current.current=next;
      if(mounted.current){setGame(next);setError(null);}
      return next;
    });
    queue.current=operation.catch(()=>{});
    return operation.catch(err=>{if(mounted.current)setError('Could not save this change. Your previous game is safe; please retry.');throw err;}).finally(()=>{pending.current--;if(mounted.current)setBusy(pending.current>0);});
  };
  return {game,busy,error,change,retry:load};
}
