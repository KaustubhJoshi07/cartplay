// Integration checks use real React hooks and mocked native/platform services.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const babel=require('@babel/core');
const React=require('react');
const {create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
const cache=new Map(),disk=new Map();let failWrite=false,failRead=false,appStateListener;
const anim=()=>({start(){},stop(){}});
const native=new Proxy({
  Animated:{Value:class{constructor(v){this.value=v;}setValue(v){this.value=v;}stopAnimation(){}},View:'AnimatedView',spring:anim,timing:anim,sequence:anim,loop:anim},
  AppState:{addEventListener(_,fn){appStateListener=fn;return {remove(){}};}},
  Alert:{alert(){}},Linking:{openURL:async()=>{}},StyleSheet:{create:x=>x},Dimensions:{get:()=>({width:390})},useWindowDimensions:()=>({width:390,height:844}),PanResponder:{create:x=>({panHandlers:x})},
  Modal:({visible,children,...props})=>visible?React.createElement('Modal',props,children):null,
  FlatList:({data,renderItem})=>React.createElement('FlatList',null,data.slice(0,12).map(item=>React.createElement(React.Fragment,{key:item.id},renderItem({item}))))
},{get:(o,k)=>o[k]||k});
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  if(file.endsWith('.jpg'))return 1;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  const module={exports:{}};cache.set(file,module);
  const source=babel.transformSync(fs.readFileSync(file,'utf8'),{babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs','@babel/plugin-transform-react-jsx']}).code;
  const customRequire=name=>{
    if(name==='react')return React;
    if(name==='react-native')return native;
    if(name==='react-native-svg')return {__esModule:true,default:'Svg',Path:'Path',Circle:'Circle',Line:'Line',Text:'SvgText'};
    if(name==='@react-native-async-storage/async-storage')return {getItem:async k=>{if(failRead)throw Error('read failed');return disk.get(k)||null;},setItem:async(k,v)=>{if(failWrite)throw Error('disk full');disk.set(k,v);}};
    if(name==='expo-haptics')return {impactAsync(){throw Error('no haptics');},notificationAsync(){return Promise.reject(Error('no haptics'));},ImpactFeedbackStyle:{Light:1},NotificationFeedbackType:{Success:1}};
    if(name==='expo-status-bar')return {StatusBar:'StatusBar'};
    if(name==='@expo/vector-icons')return {Ionicons:'Ionicons'};
    if(name.startsWith('.')){let target=path.resolve(path.dirname(file),name);if(!path.extname(target))target+='.js';return load(target);}return require(name);
  };
  vm.runInNewContext(source,{module,exports:module.exports,require:customRequire,console,Date,Math,Intl,Promise,setInterval,clearInterval,setTimeout,clearTimeout},{filename:file});return module.exports;
}
const J=load('journey.js'),{PRODUCTS}=load('catalog.js');
const F=load('fashion.js'),FASHION=require('./../fashion-catalog.json');
assert.equal(FASHION.length,1042);assert.equal(new Set(FASHION.map(p=>p.category)).size,55);
assert(FASHION.every(p=>p.isFashion&&p.imageKey&&p.color&&p.sizes?.length));
const pinkDresses=F.filterProducts(FASHION,{query:'pink dress',size:'M',sort:'A–Z'});
assert(pinkDresses.length>0);assert(pinkDresses.every(p=>p.sizes.includes('M')));
const selected=F.makeSelection(FASHION[0],'M');assert.equal(selected.selectedSize,'M');
assert.throws(()=>F.makeSelection(FASHION[0],'not-a-size'));
console.log('PASS fashion: 1,042 products, 55 categories, searchable filters, sorting and validated size selection.');
const epoch=Date.parse('2026-09-12T12:00:00Z');
// Every domestic and international duration, and delayed delivery boundaries.
for(const value of [0,0.25,0.5,0.75,0.999]) {
 const order=J.createOrder([PRODUCTS[0],PRODUCTS[2]],'dallas',epoch,()=>value);
 assert.equal(order.shipments.length,2);
 const [intl,domestic]=order.shipments;
 assert(intl.international);assert(!domestic.international);
 assert(intl.originalEta-epoch>=8*J.DAY && intl.originalEta-epoch<=12*J.DAY);
 assert(domestic.originalEta-epoch>=3*J.DAY && domestic.originalEta-epoch<=4*J.DAY);
 for(const s of order.shipments){
  assert(!J.shipmentState(s,s.eta-1).arrived);assert(J.shipmentState(s,s.eta).arrived);
  assert.equal(J.openShipment([order],s.id,s.eta-1).points,0);
  const opened=J.openShipment([order],s.id,s.eta);assert(opened.points>0);assert.equal(J.openShipment(opened.orders,s.id,s.eta+1).points,0);
  assert.equal(JSON.stringify(J.shipmentState(s,epoch+2*J.DAY)),JSON.stringify(J.shipmentState(JSON.parse(JSON.stringify(s)),epoch+2*J.DAY)));
  for(let t=epoch;t<=s.eta;t+=J.DAY/4){const status=J.shipmentState(s,t);assert(status.lon>=-180&&status.lon<=180);assert(status.lat>=-90&&status.lat<=90);assert(status.progress>=0&&status.progress<=1);}
 }
}
const lost=J.createOrder([PRODUCTS[0]],'dallas',epoch,()=>0).shipments[0];
const lostAt=lost.events.find(e=>e.title.startsWith('Misplaced')).at;
const foundAt=lost.events.find(e=>e.title.startsWith('Found!')).at;
assert(J.shipmentState(lost,lostAt).lost);assert(!J.shipmentState(lost,foundAt).lost);assert.equal(foundAt-lostAt,J.DAY/2);
const before=J.shipmentState(lost,lostAt),after=J.shipmentState(lost,foundAt-1);assert.equal(before.lon,after.lon);assert.equal(before.lat,after.lat);
assert.throws(()=>J.createOrder([],'dallas'));assert.throws(()=>J.validateGame({}));
console.log('PASS logistics: domestic/international ranges, delayed ETA, loss/recovery hold, restart determinism, map bounds, early-unbox guard and one-time rewards.');
const App=load('App.js').default;let renderer;
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const run=async fn=>act(async()=>{await fn();await settle();});
const comp=name=>renderer.root.findAll(n=>typeof n.type==='function'&&n.type.name===name)[0];
const testid=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props.testID===id)[0];
const button=label=>renderer.root.findAll(n=>typeof n.type==='function'&&n.type.name==='Button'&&n.props.label===label)[0];
const game=()=>JSON.parse(disk.get('cartplay.game.v2'));
(async()=>{
 await run(()=>{renderer=create(React.createElement(App));});
 assert(comp('Policy'));assert(!comp('Home'));
 assert(button('Accept & enter CartPlay').props.disabled);
 await run(()=>button('Decline').props.onPress());assert(!comp('Home'));
 await run(()=>button('Review and reconsider').props.onPress());
 await run(()=>testid('policy-checkbox').props.onPress());
 failWrite=true;await run(()=>button('Accept & enter CartPlay').props.onPress());assert(comp('Policy'));assert(!comp('Home'));
 failWrite=false;await run(()=>button('Accept & enter CartPlay').props.onPress());assert(comp('Home'));assert.equal(game().consent.version,J.POLICY_VERSION);assert(!testid('checkout-modal'));
 // Product image opens a full-screen viewer and supports bounded zoom controls.
 await run(()=>comp('Home').props.onOpen(PRODUCTS[0]));assert(comp('ProductDetails'));
 await run(()=>testid('open-image-viewer').props.onPress());assert(testid('image-viewer'));
 await run(()=>testid('zoom-in').props.onPress());assert(testid('image-viewer'));
 await run(()=>renderer.root.findAll(n=>n.props?.accessibilityLabel==='Close image viewer')[0].props.onPress());assert(!renderer.root.findAll(n=>n.props?.testID==='image-viewer').length);
 await run(()=>comp('ProductDetails').props.onClose());assert(!comp('ProductDetails'));
 // Queue several adds in one turn: no lost updates.
 await run(()=>{comp('Home').props.onAdd(PRODUCTS[0]);comp('Home').props.onAdd(PRODUCTS[2]);});assert.equal(game().cart.length,2);
 await run(()=>comp('BottomNav').props.setTab('Cart'));
 await run(()=>comp('Cart').props.onCheckout());assert(comp('SwipePay'));
 await run(()=>comp('SwipePay').props.onCancel());assert(!comp('SwipePay'));assert.equal(game().cart.length,2);
 await run(()=>comp('Cart').props.onCheckout());
 await run(()=>testid('checkout-swipe').props.onLayout({nativeEvent:{layout:{width:342}}}));
 await run(()=>testid('checkout-swipe').props.onPanResponderRelease(null,{dx:20}));assert(comp('SwipePay'));assert.equal(game().orders.length,0);
 failWrite=true;await run(()=>testid('checkout-swipe').props.onPanResponderRelease(null,{dx:160}));assert(comp('SwipePay'));assert.equal(game().orders.length,0);assert.equal(game().cart.length,2);
 failWrite=false;
 await run(()=>{const release=testid('checkout-swipe').props.onPanResponderRelease;release(null,{dx:160});release(null,{dx:160});});
 assert(comp('Success'));assert(!comp('SwipePay'));assert.equal(game().orders.length,1);assert.equal(game().orders[0].shipments.length,2);assert.equal(game().cart.length,0);
 await run(()=>comp('Success').props.onTrack());assert(comp('Orders'));assert(!testid('checkout-modal'));
 const stored=JSON.stringify(game());await run(()=>renderer.unmount());await run(()=>{renderer=create(React.createElement(App));});assert(comp('Home'));assert.equal(JSON.stringify(game()),stored);
 await run(()=>comp('BottomNav').props.setTab('Orders'));assert(comp('WorldMap'));
 // Advance the real clock in tests only; production has no time skip.
 const originalNow=Date.now;Date.now=()=>Math.max(...game().orders[0].shipments.map(s=>s.eta))+1;
 await run(()=>appStateListener('active'));
 const id=game().orders[0].shipments[0].id;const oldPoints=game().points;
 await run(()=>{comp('Orders').props.onUnbox(id);comp('Orders').props.onUnbox(id);});assert.equal(game().points,oldPoints+game().orders[0].shipments[0].unboxPoints);
 Date.now=originalNow;
 await run(()=>comp('BottomNav').props.setTab('Home'));await run(()=>comp('Home').props.onAdd(PRODUCTS[1]));await run(()=>comp('BottomNav').props.setTab('Cart'));await run(()=>comp('Cart').props.onCheckout());
 await run(()=>testid('checkout-confirm').props.onPress());assert(comp('Success'));assert.equal(game().orders.length,2);
 await run(()=>comp('Success').props.onTrack());await run(()=>comp('BottomNav').props.setTab('Me'));assert(comp('Playroom'));
 await run(()=>comp('Playroom').props.onQuiet(true));assert.equal(game().quiet,true);
 await run(()=>comp('Playroom').props.onPolicy());assert(comp('Policy').props.readOnly);await run(()=>comp('Policy').props.onClose());assert(comp('Playroom'));
 await run(()=>renderer.unmount());
 failRead=true;await run(()=>{renderer=create(React.createElement(App));});assert(!comp('Home'));assert(!comp('Policy'));await run(()=>renderer.unmount());
 console.log('PASS React integration: policy gating/decline/failed-save, queued cart updates, checkout cancel, short/full swipe, failed checkout retry, duplicate guard, persistent restart, world map, unboxing, second checkout/tap, quiet settings, policy review, read-error gate.');
})().catch(async e=>{console.error(e);if(renderer)await act(async()=>renderer.unmount());process.exitCode=1;});
