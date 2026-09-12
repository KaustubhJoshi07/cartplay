import React,{useEffect,useRef,useState} from 'react';
import {Animated,AppState,Alert,Linking,Pressable,SafeAreaView,ScrollView,StyleSheet,Switch,Text,View} from 'react-native';
import Svg,{Path,Circle,Line,Text as SvgText} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import land from './assets/world-land.json';
import {CITIES,city,POLICY_VERSION,shipmentState,timeLeft,money} from './journey';
export function useClock() {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),10000);const listener=AppState.addEventListener('change',s=>{if(s==='active')setNow(Date.now());});return()=>{clearInterval(timer);listener.remove();};},[]);
  return now;
}
export function Button({label,onPress,disabled=false,secondary=false}) {return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[a.button,secondary&&a.secondary,disabled&&{opacity:0.45}]}><Text style={[a.buttonText,secondary&&{color:'#6547d9'}]}>{label}</Text></Pressable>;}
export const Disclosure=()=> <Text style={a.disclosure}>SIMULATION · $0 CHARGED · NO REAL DELIVERY</Text>;
export function Policy({onAccept,busy,error,readOnly=false,onClose}) {
  const [checked,setChecked]=useState(false),[declined,setDeclined]=useState(false);
  return <SafeAreaView style={a.page}><ScrollView contentContainerStyle={a.policy}>
    <Text style={a.kicker}>WELCOME TO CARTPLAY · STYLE EDIT 0.3</Text>
    <Text style={a.title}>{declined?'No problem. Your choice.':readOnly?'The rules of play':'Real-world wishes.\nMake-believe shopping.'}</Text>
    <Text style={a.body}>CartPlay is a fictional shopping game for entertainment. Please read and accept these rules before playing.</Text>
    {[
      ['Everything is pretend','Products, carts, payments, packages, locations, tracking scans, delivery dates, customs events, and courier messages inside CartPlay are simulations. Nothing is purchased, charged, shipped, or physically delivered.'],
      ['Dollars are a display','Prices use US dollars for atmosphere. They are illustrative game prices, not a real balance, a bill, or a live retailer price. Points and collectibles have no monetary value and cannot be redeemed. We never ask for a card or bank account.'],
      ['Real names, fictional journeys','Fashion items come from a historical inspiration archive, not current retailer inventory. Size choices are fictional game options. Some other catalog names refer to real products listed on Amazon. CartPlay is not Amazon and is not affiliated with or endorsed by Amazon or those brands. Listing availability may change. Origins and routes do not describe actual sellers or factories.'],
      ['Slow deliveries, silly surprises','Domestic journeys are planned for 3–4 days; international journeys take 8–12 days. A misplaced package can add 12 hours and will be found automatically. This is part of the game. No real courier can investigate these orders.'],
      ['Your game stays on this device','Acceptance, cart, city selection, orders, and collectibles are saved locally. No account, precise address, GPS, payment data, analytics, or push notifications are needed. Deleting app data removes your game. Product image requests and optional retailer links contact external services, which have their own privacy policies.'],
      ['Play on your terms','You can turn off package animation, leave at any time, and review these rules in Me. This is entertainment, not a treatment or a promise about dopamine or wellbeing.']
    ].map(([title,body])=><View key={title} style={a.card}><Text style={a.h2}>{title}</Text><Text style={a.body}>{body}</Text></View>)}
    <Text style={a.small}>Policy version {POLICY_VERSION}</Text>
    {error&&<Text accessibilityRole="alert" style={a.error}>{error}</Text>}
    {readOnly?<Button label="Back to my playroom" onPress={onClose}/>:declined?<><Text style={a.body}>The shopping game remains locked until you accept. You can close the app now.</Text><Button label="Review and reconsider" onPress={()=>setDeclined(false)} secondary/></>:<>
      <Pressable testID="policy-checkbox" accessibilityRole="checkbox" accessibilityState={{checked}} onPress={()=>setChecked(!checked)} style={a.check}><Ionicons name={checked?'checkbox':'square-outline'} size={28} color="#6547d9"/><Text style={[a.body,{flex:1}]}>I understand this is a fake shopping game. No money is charged and no real products are delivered. I accept these rules.</Text></Pressable>
      <Button label={busy?'Saving acceptance…':'Accept & enter CartPlay'} disabled={!checked||busy} onPress={onAccept}/>
      <Button label="Decline" disabled={busy} onPress={()=>setDeclined(true)} secondary/>
    </>}
  </ScrollView></SafeAreaView>;
}
export function DestinationPicker({value,onChange,disabled}) {return <View><Text style={a.h2}>Your fictional delivery city</Text><Text style={a.small}>No address or location permission needed. Routes are invented for play.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={a.pills}>{CITIES.map(c=><Pressable accessibilityRole="button" accessibilityState={{selected:value===c.id}} disabled={disabled} key={c.id} onPress={()=>onChange(c.id)} style={[a.pill,value===c.id&&a.pillActive]}><Text style={[a.pillText,value===c.id&&{color:'white'}]}>{c.name} · {c.country}</Text></Pressable>)}</ScrollView></View>;}
const project=(lon,lat)=>[(lon+180)*2,(90-lat)*2];
function pathFor(route,shift) {
  let prev=null;
  return route.map((stop,i)=>{
    const c=city(stop.cityId);let [x,y]=project(c.lon,c.lat);
    if(prev!==null){while(x-prev>360)x-=720;while(x-prev< -360)x+=720;}prev=x;
    return `${i?'L':'M'}${x+shift},${y}`;
  }).join(' ');
}
export function WorldMap({shipment,now,quiet}) {
  const s=shipmentState(shipment,now),origin=city(shipment.originId),dest=city(shipment.destinationId);
  const [mapWidth,setMapWidth]=useState(320),[zoom,setZoom]=useState(false);
  const bob=useRef(new Animated.Value(0)).current;
  useEffect(()=>{if(quiet){bob.setValue(0);return;}const anim=Animated.loop(Animated.sequence([Animated.timing(bob,{toValue:-5,duration:650,useNativeDriver:true}),Animated.timing(bob,{toValue:0,duration:650,useNativeDriver:true})]));anim.start();return()=>anim.stop();},[quiet,bob]);
  const [px,py]=project(s.lon,s.lat),vw=zoom?280:720,vh=vw/2,vx=zoom?Math.max(0,Math.min(720-vw,px-vw/2)):0,vy=zoom?Math.max(0,Math.min(360-vh,py-vh/2)):0;
  return <View style={a.mapCard}><View style={a.row}><Text style={a.mapTitle}>PACKAGE RADAR</Text><Pressable accessibilityRole="button" onPress={()=>setZoom(!zoom)}><Text style={a.mapLink}>{zoom?'Show whole world':'Zoom to package'}</Text></Pressable></View>
    <View accessible accessibilityLabel={`Fictional world map. Package ${s.latest.title}, last scan ${s.latest.location}.`} onLayout={e=>setMapWidth(e.nativeEvent.layout.width)} style={{width:'100%',aspectRatio:2,overflow:'hidden',backgroundColor:'#111c36',borderRadius:14}}>
      <Svg width="100%" height="100%" viewBox={`${vx} ${vy} ${vw} ${vh}`}>
        {[60,120,180,240,300].map(y=><Line key={y} x1={0} y1={y} x2={720} y2={y} stroke="#22304d" strokeWidth={0.5}/>)}
        {land.map((d,i)=><Path key={i} d={d} fill="#344561" stroke="#50617b" strokeWidth={0.35}/>)}
        {[-720,0,720].map(shift=><Path key={shift} d={pathFor(shipment.route,shift)} stroke="#bc9dff" strokeWidth={2} strokeDasharray="5 4" fill="none"/>)}
        {[origin,dest].map((c,i)=>{const [x,y]=project(c.lon,c.lat);return <React.Fragment key={i}><Circle cx={x} cy={y} r={4} fill={i?'#67e0ba':'#d7c2ff'}/><SvgText x={x} y={y+13} fill="white" fontSize={9} textAnchor="middle">{c.name}</SvgText></React.Fragment>;})}
      </Svg>
      <Animated.View pointerEvents="none" style={{position:'absolute',left:(px-vx)/vw*mapWidth-13,top:(py-vy)/vh*(mapWidth/2)-20,transform:[{translateY:bob}]}}><Text style={{fontSize:26}}>{s.arrived?'🎁':'📦'}</Text></Animated.View>
    </View>
    <Text style={a.mapLegend}>{s.lost?'Search crew active':s.arrived?'At your imaginary doorstep':s.moving?`On the way: ${s.from.name} → ${s.to.name}`:`At ${s.from.name} hub`} · Simulated position</Text>
    <Text style={a.mapFoot}>World land: Natural Earth · Fictional route, not GPS</Text>
  </View>;
}
export function Orders({orders,quiet,onUnbox,busy}) {
  const now=useClock();const shipments=orders.flatMap(o=>o.shipments);
  const [selected,setSelected]=useState(null);
  const shipment=shipments.find(s=>s.id===selected)||shipments[0];
  if(!shipment)return <View style={[a.page,a.center]}><Text style={a.bigEmoji}>🌍</Text><Text style={a.title}>Your next adventure awaits</Text><Text style={a.body}>Place a virtual order to send a little package across the map.</Text></View>;
  const s=shipmentState(shipment,now);
  const date=t=>new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  const recovered=s.elapsedEvents.some(e=>e.title.startsWith('Found!'));
  return <ScrollView style={a.page} contentContainerStyle={a.content}>
    <Text style={a.kicker}>YOUR PARCEL ADVENTURES</Text><Text style={a.title}>Where in the world?</Text><Disclosure/>
    <ScrollView horizontal contentContainerStyle={a.pills}>{shipments.map(p=><Pressable accessibilityRole="button" key={p.id} onPress={()=>setSelected(p.id)} style={[a.pill,p.id===shipment.id&&a.pillActive]}><Text style={[a.pillText,p.id===shipment.id&&{color:'white'}]}>{p.item.name.slice(0,24)} {p.openedAt?'✓':shipmentState(p,now).arrived?'🎁':'📦'}</Text></Pressable>)}</ScrollView>
    <WorldMap key={shipment.id} shipment={shipment} now={now} quiet={quiet}/>
    <View style={a.card}><Text style={a.small}>{shipment.id}</Text><Text style={a.h2}>{shipment.item.name}</Text><Text style={a.small}>{shipment.item.color}{shipment.item.selectedSize?` · Size ${shipment.item.selectedSize}`:""}</Text><Text style={a.body}>{city(shipment.originId).name}, {city(shipment.originId).countryName} → {city(shipment.destinationId).name}, {city(shipment.destinationId).countryName}</Text><Text style={a.small}>{shipment.international?'International · planned 8–12 days':'Domestic · planned 3–4 days'} · USD game value {money(shipment.item.price)}</Text><Text style={a.status}>{s.latest.title}</Text><Text style={a.body}>{s.latest.note}</Text><Text style={a.small}>Last scan: {s.latest.location}</Text><View style={a.progress}><View style={[a.progressFill,{width:`${s.progress*100}%`}]}/></View><Text style={a.h2}>{timeLeft(s.remaining)}</Text><Text style={a.small}>ETA {date(s.displayEta)}{s.lost||recovered?' · updated +12h after sorting mix-up':''}</Text></View>
    {s.lost&&<View style={[a.card,{backgroundColor:'#fff0d9'}]}><Text style={a.h2}>🕵️ Operation Find That Box</Text><Text style={a.body}>The parcel took the wrong trolley. Recovery happens automatically; no action or payment is needed. Your package will return with a souvenir stamp.</Text></View>}
    {s.arrived&&!shipment.openedAt&&<View style={[a.card,{backgroundColor:'#eee7ff'}]}><Text style={a.h2}>A surprise is waiting inside</Text><Button label="Unbox my virtual delivery 🎁" disabled={busy} onPress={()=>onUnbox(shipment.id)}/></View>}
    {shipment.openedAt&&<View style={[a.card,{backgroundColor:'#e4f7ed'}]}><Text style={a.bigEmoji}>{shipment.rarity==='Golden'?'🏆':'🎉'}</Text><Text style={a.h2}>{shipment.rarity} collectible: {shipment.sticker}</Text><Text style={a.body}>+{shipment.unboxPoints} Joy Points collected. Your souvenir is saved in Me.</Text></View>}
    <Text style={a.h2}>The travel diary</Text>
    {[...s.elapsedEvents].reverse().map((e,i)=><View style={a.event} key={`${e.at}-${e.title}`}><View style={[a.eventDot,i===0&&{backgroundColor:'#6c4cf1'}]}/><View style={{flex:1}}><Text style={a.h2}>{e.title}</Text><Text style={a.small}>{date(e.at)} · {e.location}</Text><Text style={a.body}>{e.note}</Text></View></View>)}
    <Text style={a.small}>The journey advances in real elapsed time, even while the app is closed. New scans appear when you return. No real shipment exists.</Text>
  </ScrollView>;
}
export function Playroom({game,onDestination,onQuiet,onPolicy,onReset,busy}) {
  const packages=game.orders.flatMap(o=>o.shipments);const opened=packages.filter(s=>s.openedAt);
  const countries=[...new Set(opened.map(s=>city(s.originId).countryName))];
  return <ScrollView style={a.page} contentContainerStyle={a.content}><Text style={a.kicker}>YOUR PERSONAL SOUVENIR SHELF</Text><Text style={a.title}>My playroom</Text><Disclosure/>
    <View style={a.stats}>{[[game.points,'Joy Points'],[game.orders.length,'Orders'],['$0','Real spent']].map(([v,label])=><View key={label}><Text style={a.stat}>{v}</Text><Text style={a.small}>{label}</Text></View>)}</View>
    <DestinationPicker value={game.destinationId} onChange={onDestination} disabled={busy}/>
    <View style={a.card}><Text style={a.h2}>My package passport</Text><Text style={a.body}>{countries.length?countries.map(x=>`✈ ${x}`).join('   '):'Unbox an arrival to collect its origin-country stamp.'}</Text></View>
    <Text style={a.h2}>Surprise collection · {opened.length}</Text>
    {opened.length?opened.map(s=><View style={a.card} key={s.id}><Text style={a.h2}>{s.rarity==='Golden'?'🏆':'🏷️'} {s.sticker}</Text><Text style={a.body}>{s.item.name}{s.item.selectedSize?` · Size ${s.item.selectedSize}`:""}</Text><Text style={a.small}>From {city(s.originId).name} · +{s.unboxPoints} Joy Points</Text></View>):<Text style={a.body}>Postcards, a Lost & Found souvenir, and occasional golden wrapping await. All rewards are free and have no cash value.</Text>}
    <View style={[a.card,a.row]}><View style={{flex:1}}><Text style={a.h2}>Quiet package animation</Text><Text style={a.small}>Stop the bouncing box on the map.</Text></View><Switch value={game.quiet} disabled={busy} onValueChange={onQuiet}/></View>
    <Button label="Review the rules of play" onPress={onPolicy} secondary/>
    <Text style={a.small}>No streaks, push reminders, or paid shortcuts. Come back whenever you feel like it.</Text>
    <Button label="Reset my local game" disabled={busy} onPress={()=>Alert.alert('Reset CartPlay?','This permanently removes your saved orders, cart, points, and policy acceptance from this device.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:onReset}])} secondary/>
    <Text style={a.small}>CartPlay Style Edit 0.3 · Local-only save</Text>
  </ScrollView>;
}
export function SourceLink({url}) {return <Button label="View source listing on Amazon ↗" secondary onPress={()=>Alert.alert('Leave the simulation?','This opens the real Amazon website. Purchases there cost real money; CartPlay never purchases anything.',[{text:'Stay here',style:'cancel'},{text:'Open listing',onPress:()=>Linking.openURL(url).catch(()=>Alert.alert('Could not open link','Try again when your connection is available.'))}])}/>;}
const a=StyleSheet.create({
  page:{flex:1,backgroundColor:'#f7f5fb'},content:{padding:20,paddingBottom:120,gap:14},policy:{padding:24,paddingBottom:48,gap:18},center:{justifyContent:'center',alignItems:'center',padding:24},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:'#6c4cf1'},title:{fontSize:30,fontWeight:'900',color:'#201b30',letterSpacing:-0.8},h2:{fontSize:16,fontWeight:'800',color:'#272135'},body:{fontSize:14,lineHeight:21,color:'#635b70'},small:{fontSize:11,lineHeight:17,color:'#797182'},card:{backgroundColor:'white',padding:18,borderRadius:20,gap:8},disclosure:{fontSize:9,fontWeight:'800',color:'#7657bf',letterSpacing:0.7},button:{backgroundColor:'#6c4cf1',padding:17,borderRadius:15,alignItems:'center',marginTop:8},secondary:{backgroundColor:'#ebe5fa'},buttonText:{fontSize:14,fontWeight:'800',color:'white'},check:{flexDirection:'row',gap:12,alignItems:'center'},error:{color:'#b53737',fontSize:13},pills:{gap:8,paddingVertical:13},pill:{borderRadius:18,paddingHorizontal:14,paddingVertical:10,backgroundColor:'white',borderWidth:1,borderColor:'#e2dced'},pillActive:{backgroundColor:'#292035',borderColor:'#292035'},pillText:{fontSize:12,color:'#645b70',fontWeight:'700'},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},mapCard:{backgroundColor:'#111c36',borderRadius:22,padding:15,gap:13},mapTitle:{fontSize:10,color:'#ded0ff',fontWeight:'900',letterSpacing:1},mapLink:{fontSize:11,color:'#acdeff'},mapLegend:{color:'#e2dcec',fontSize:11},mapFoot:{color:'#8f9cb6',fontSize:9},status:{fontSize:21,color:'#6c4cf1',fontWeight:'900',marginTop:12},progress:{height:6,backgroundColor:'#ece7f7',borderRadius:4,overflow:'hidden',marginVertical:8},progressFill:{height:6,backgroundColor:'#8864ee'},event:{flexDirection:'row',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#e9e3f0'},eventDot:{width:10,height:10,borderRadius:5,backgroundColor:'#c6b6de',marginTop:5},bigEmoji:{fontSize:44},stats:{flexDirection:'row',justifyContent:'space-around',padding:24,backgroundColor:'#eee7fa',borderRadius:22},stat:{fontSize:24,fontWeight:'900',color:'#4f3480',textAlign:'center'}
});
