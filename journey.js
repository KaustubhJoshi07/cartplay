// CartPlay's fictional logistics engine. No carrier, retailer, or GPS connection.
export const DAY = 86400000;
export const POLICY_VERSION = '2026-09-12-v2';
export const CITIES = [
  { id:'dallas',name:'Dallas',country:'US',countryName:'United States',lat:32.78,lon:-96.8 },
  { id:'newyork',name:'New York',country:'US',countryName:'United States',lat:40.71,lon:-74.01 },
  { id:'losangeles',name:'Los Angeles',country:'US',countryName:'United States',lat:34.05,lon:-118.24 },
  { id:'seattle',name:'Seattle',country:'US',countryName:'United States',lat:47.61,lon:-122.33 },
  { id:'chicago',name:'Chicago',country:'US',countryName:'United States',lat:41.88,lon:-87.63 },
  { id:'tokyo',name:'Tokyo',country:'JP',countryName:'Japan',lat:35.68,lon:139.69 },
  { id:'copenhagen',name:'Copenhagen',country:'DK',countryName:'Denmark',lat:55.68,lon:12.57 },
  { id:'mumbai',name:'Mumbai',country:'IN',countryName:'India',lat:19.08,lon:72.88 },
  { id:'shenzhen',name:'Shenzhen',country:'CN',countryName:'China',lat:22.54,lon:114.06 },
  { id:'london',name:'London',country:'GB',countryName:'United Kingdom',lat:51.51,lon:-0.13 },
  { id:'sydney',name:'Sydney',country:'AU',countryName:'Australia',lat:-33.87,lon:151.21 },
  { id:'saopaulo',name:'São Paulo',country:'BR',countryName:'Brazil',lat:-23.55,lon:-46.63 },
  { id:'capetown',name:'Cape Town',country:'ZA',countryName:'South Africa',lat:-33.92,lon:18.42 },
];
export const city = id => CITIES.find(c=>c.id===id) || CITIES[0];
export const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
const clamp = x => Math.max(0,Math.min(1,x));
export function createOrder(items, destinationId, now=Date.now(), random=Math.random) {
  if (!items.length) throw new Error('Add an item before checkout.');
  const destination = city(destinationId);
  const id = `CP-${now.toString(36).toUpperCase()}-${Math.floor(random()*1e6).toString(36).toUpperCase()}`;
  const shipments = items.map((item,index)=> {
    const origin = city(item.originId);
    const international = origin.country !== destination.country;
    const days = international ? 8 + Math.floor(random()*5) : 3 + Math.floor(random()*2);
    const mishap = random() < 0.22;
    const hasPostcard = random() < 0.65;
    const rare = random() < 0.12;
    const baseDuration = days * DAY;
    const delay = mishap ? DAY/2 : 0;
    const duration = baseDuration+delay;
    const hub = international && destination.country==='US' ? city(origin.lon>0?'losangeles':'newyork') : destination;
    const label = (c,area)=>`${c.name}, ${c.countryName} · ${area}`;
    const event = (fraction,title,where,note)=>({at:now+baseDuration*fraction+(fraction>=0.65?delay:0),title,cityId:where.id,location:label(where,'CartPlay hub'),note});
    const events=[event(0,'Order placed',origin,'Your virtual adventure is booked.'),event(0.05,'Packed with imaginary care',origin,'A tiny packing team selected your box.'),event(0.18,'Left the origin hub',origin,international?'Heading to the international departure terminal.':'Your package has joined the road trip.'),event(0.48,international?'Arrival scan · destination country':'Regional sorting scan',hub,international?'Fictional customs inspection begins.':'The conveyor belt has excellent taste.')];
    if(hasPostcard) events.push(event(0.49,'A postcard from your package',hub,'“Wish you were here. The conveyor-belt buffet is overrated.”'));
    if(mishap) {
      events.push(event(0.52,'Misplaced at the sorting hub',hub,'Your box followed the wrong trolley. The search crew is on it.'));
      events.push({at:now+baseDuration*0.52+delay,title:'Found! Back on the right trolley',cityId:hub.id,location:label(hub,'recovery desk'),note:'Your package returns with a Lost & Found souvenir stamp.'});
    }
    events.push(event(0.78,'Reached your local delivery hub',destination,'A fictional courier has your package.'),event(0.93,'Out for delivery',destination,'Almost at your imaginary doorstep.'),{at:now+duration,title:'Delivered · ready to unbox',cityId:destination.id,location:label(destination,'dream doorstep'),note:'No real package exists. Your collectible is ready.'});
    events.sort((a,b)=>a.at-b.at);
    const route=[{at:now,cityId:origin.id},{at:now+baseDuration*0.18,cityId:origin.id},{at:now+baseDuration*0.48,cityId:hub.id},{at:now+baseDuration*0.65+delay,cityId:hub.id},{at:now+baseDuration*0.93+delay,cityId:destination.id},{at:now+duration,cityId:destination.id}];
    return {id:`${id}-${index+1}`,item,originId:origin.id,destinationId:destination.id,international,createdAt:now,eta:now+duration,originalEta:now+baseDuration,delay,mishap,events,route,openedAt:null,rarity:rare?'Golden':'Classic',sticker:rare?'Golden globetrotter':mishap?'Lost & Found hero':hasPostcard?'Postcard collector':'Happy little parcel',unboxPoints:rare?50:10};
  });
  return {id,createdAt:now,destinationId:destination.id,items:items.map(x=>({...x})),points:items.reduce((a,x)=>a+x.reward,0),total:items.reduce((a,x)=>a+x.price,0),shipments};
}
export function shipmentState(shipment, now=Date.now()) {
  const elapsedEvents=shipment.events.filter(e=>e.at<=now);
  const latest=elapsedEvents.at(-1) || shipment.events[0];
  const arrived=now>=shipment.eta;
  const lost=latest.title==='Misplaced at the sorting hub';
  const displayEta=elapsedEvents.some(e=>e.title==='Misplaced at the sorting hub') ? shipment.eta : shipment.originalEta;
  let from=shipment.route[0],to=from;
  for(let i=1;i<shipment.route.length;i++) {
    to=shipment.route[i]; if(now<to.at) break; from=to;
  }
  const t=to.at===from.at?1:clamp((now-from.at)/(to.at-from.at));
  const a=city(from.cityId),b=city(to.cityId);
  const delta=((b.lon-a.lon+540)%360)-180;
  const lon=((a.lon+delta*t+540)%360)-180;
  return {latest,elapsedEvents,arrived,lost,displayEta,lat:a.lat+(b.lat-a.lat)*t,lon,progress:clamp((now-shipment.createdAt)/(shipment.eta-shipment.createdAt)),remaining:Math.max(0,displayEta-now),moving:!arrived && !lost && a.id!==b.id,from:a,to:b};
}
export function openShipment(orders,id,now=Date.now()) {
  let points=0;
  const next=orders.map(order=>({...order,shipments:order.shipments.map(s=> {
    if(s.id!==id || s.openedAt || now<s.eta) return s;
    points+=s.unboxPoints;
    return {...s,openedAt:now};
  })}));
  return {orders:next,points};
}
export function timeLeft(ms) {
  if(ms<=0) return 'Ready to unbox';
  const hours=Math.ceil(ms/3600000);
  return hours>=24?`${Math.floor(hours/24)}d ${hours%24}h remaining`:`${hours}h remaining`;
}
export const emptyGame = () => ({version:2,consent:null,favorites:[],cart:[],orders:[],points:0,destinationId:'dallas',quiet:false});
export function validateGame(value) {
  if(!value || value.version!==2 || !Array.isArray(value.cart) || !Array.isArray(value.orders) || !Number.isFinite(value.points) || !CITIES.some(c=>c.id===value.destinationId)) throw new Error('Saved game could not be loaded.');
  if(value.cart.some(p=>!p.id||!Number.isFinite(p.price)||!Number.isFinite(p.reward))) throw new Error('Invalid saved cart.');
  if(value.orders.some(o=>!o.id||!Array.isArray(o.shipments)||o.shipments.some(s=>!s.item||!Number.isFinite(s.eta)||!Array.isArray(s.events)||!s.events.length||!Array.isArray(s.route)||!s.route.length))) throw new Error('Invalid saved orders.');
  return {...value,favorites:Array.isArray(value.favorites)?value.favorites.filter(x=>typeof x==='string'):[]};
}
