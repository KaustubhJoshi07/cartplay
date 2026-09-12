import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { PRODUCTS } from './catalog';
import FashionStore, { CatalogImage } from './FashionStore';
import { makeSelection } from './fashion';
import { createOrder, openShipment, city, money, POLICY_VERSION, emptyGame } from './journey';
import { useGame } from './storage';
import { Policy, Orders, Playroom, DestinationPicker, SourceLink, Disclosure } from './Adventure';

const PURPLE = "#6C4CF1";
const INK = "#191724";
const MUTED = "#777184";
const BG = "#F7F5FB";
const { width } = Dimensions.get("window");

// Feedback must never block navigation on devices without haptic support.
function safeHaptic(kind = "success") {
  try {
    const result = kind === "light"
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Promise.resolve(result).catch(() => {});
  } catch {}
}



function ProductImage(props) { return <CatalogImage {...props}/>; }

function SimBadge() {
  return <View style={styles.simBadge}><Ionicons name="game-controller" size={12} color={PURPLE} /><Text style={styles.simText}>SIMULATION · $0 CHARGED</Text></View>;
}

function ProductCard({ item, onOpen, onAdd, compact = false }) {
  return (
    <Pressable style={[styles.card, compact && styles.compactCard]} onPress={() => onOpen(item)}>
      <ProductImage item={item} style={[styles.productImage, compact && styles.compactImage]} />
      <View style={styles.cardBody}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.price}>{money(item.price)} <Text style={styles.simCurrency}>USD</Text></Text>
          <Pressable style={styles.plus} onPress={(event) => { event.stopPropagation?.(); onAdd(item); }}>
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function Home(props) { return <FashionStore {...props}/>; }
function Discover(props) { return <FashionStore {...props} searchFirst/>; }
function ProductModal({product,...props}) {
  if(!product)return null;
  return <ProductDetails key={product.id} product={product} {...props}/>;
}
function ProductDetails({product,onClose,onAdd,favorites=[],onFavorite=()=>{}}) {
  const [size,setSize]=useState(product.sizes?.length===1?product.sizes[0]:null);
  const [adding,setAdding]=useState(false),[error,setError]=useState(null);
  const [imageOpen,setImageOpen]=useState(false),[imageZoom,setImageZoom]=useState(1);
  const needsSize=!!product.sizes?.length;
  const submit=async()=>{
    if(adding || (needsSize&&!size))return;
    setAdding(true);setError(null);
    try{await onAdd(makeSelection(product,size));onClose();}
    catch{setError('Could not save this item. Please try again.');setAdding(false);}
  };
  return <Modal animationType="slide" visible onRequestClose={()=>{if(!adding)onClose();}}><SafeAreaView style={styles.modalPage}>
    <View style={styles.modalTop}><Pressable disabled={adding} style={styles.circleButton} onPress={onClose}><Ionicons name="chevron-down" size={24} color={INK}/></Pressable><SimBadge/><Pressable accessibilityRole="button" accessibilityLabel="Toggle saved style" onPress={()=>onFavorite(product.id)} style={styles.circleButton}><Ionicons name={favorites.includes(product.id)?'heart':'heart-outline'} size={22} color="#a94e7b"/></Pressable></View>
    <ScrollView><Pressable testID="open-image-viewer" accessibilityRole="button" accessibilityLabel={`Open ${product.name} image viewer`} onPress={()=>{setImageZoom(1);setImageOpen(true);}} style={styles.detailImageButton}><ProductImage item={product} style={styles.detailImage}/><View pointerEvents="none" style={styles.zoomHint}><Ionicons name="expand-outline" size={17} color="white"/><Text style={styles.zoomHintText}>Tap to enlarge</Text></View></Pressable><View style={styles.detailBody}>
      <Text style={styles.category}>{product.category.toUpperCase()} · {product.color.toUpperCase()}</Text><Text style={styles.detailTitle}>{product.name}</Text>
      <Text style={styles.detailPrice}>{money(product.price)} <Text style={styles.simCurrency}>USD · GAME PRICE</Text></Text>
      {needsSize&&<><Text style={styles.sectionTitle}>Choose your game size{size?` · ${size}`:''}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{product.sizes.map(v=><Pressable testID={`size-${v}`} accessibilityRole="button" accessibilityState={{selected:size===v}} key={v} onPress={()=>setSize(v)} style={[styles.chip,size===v&&styles.chipActive]}><Text style={[styles.chipText,size===v&&styles.chipTextActive]}>{v}</Text></Pressable>)}</View><Text style={styles.description}>Sizes are pretend game options, not a verified fit guide or available retailer inventory. The photograph shows {product.color.toLowerCase()}.</Text></>}
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.description}>{product.isFashion?'From a historical fashion inspiration archive. Not a current Amazon listing.':'Based on a real source listing; stock is not synchronized.'} Prices are illustrative. No real item will arrive.</Text>
      <View style={styles.rewardBox}><Ionicons name="sparkles" size={22} color={PURPLE}/><View><Text style={styles.rewardTitle}>+{product.reward} Joy Points</Text><Text style={styles.rewardNote}>Earned after simulated checkout</Text></View></View>
      <Text style={styles.description}>Fictional origin: {city(product.originId).name}, {city(product.originId).countryName}. This is a game location, not a seller warehouse.</Text>
      {!product.isFashion&&<SourceLink url={product.sourceUrl}/>}
      <Text style={styles.microcopy}>{product.isFashion?`${product.sourceName} · Reference photo${product.sourceYear?` · ${product.sourceYear}`:''}`:`Listing checked ${product.sourceChecked}`}</Text>
      {error&&<Text accessibilityRole="alert" style={{color:'#b53737',marginTop:12}}>{error}</Text>}
    </View></ScrollView>
    <View style={styles.sticky}><Pressable testID="add-selected-product" accessibilityRole="button" disabled={adding||(needsSize&&!size)} style={[styles.addButton,(adding||(needsSize&&!size))&&{opacity:0.45}]} onPress={submit}><Text style={styles.addButtonText}>{adding?'Saving…':needsSize&&!size?'Choose a size first':'Add to dream cart'}</Text><Ionicons name="bag-add-outline" size={20} color="white"/></Pressable><Text style={styles.microcopy}>Simulation · $0 charged · No real delivery</Text></View>
    {imageOpen&&<View testID="image-viewer" style={styles.imageViewer}><View style={styles.viewerTop}><Pressable accessibilityRole="button" accessibilityLabel="Close image viewer" onPress={()=>setImageOpen(false)} style={styles.viewerCircle}><Ionicons name="close" size={27} color="white"/></Pressable><Text style={styles.viewerTitle} numberOfLines={1}>{product.name}</Text><View style={{width:44}}/></View><View style={styles.viewerStage}><Animated.View style={{transform:[{scale:imageZoom}]}}><ProductImage item={product} style={styles.viewerImage}/></Animated.View></View><View style={styles.viewerControls}><Pressable testID="zoom-out" accessibilityRole="button" accessibilityLabel="Zoom out" disabled={imageZoom<=1} onPress={()=>setImageZoom(v=>Math.max(1,+(v-.5).toFixed(1)))} style={[styles.viewerControl,imageZoom<=1&&{opacity:.35}]}><Ionicons name="remove" size={25} color="white"/></Pressable><Text style={styles.viewerZoom}>{Math.round(imageZoom*100)}%</Text><Pressable testID="zoom-in" accessibilityRole="button" accessibilityLabel="Zoom in" disabled={imageZoom>=3} onPress={()=>setImageZoom(v=>Math.min(3,+(v+.5).toFixed(1)))} style={[styles.viewerControl,imageZoom>=3&&{opacity:.35}]}><Ionicons name="add" size={25} color="white"/></Pressable><Pressable accessibilityRole="button" onPress={()=>setImageZoom(1)} style={styles.viewerReset}><Text style={styles.viewerResetText}>Reset</Text></Pressable></View><Text style={styles.viewerNote}>{product.isFashion?'This archive preview has limited resolution. A higher-resolution catalog image is required for a sharper zoom.':'Pinch-free preview with zoom controls.'}</Text></View>}
  </SafeAreaView></Modal>;
}

function Cart({ items, onRemove, onCheckout, destinationId, onDestination, busy }) {
  const total = items.reduce((sum, x) => sum + x.price, 0);
  if (!items.length) return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="bag-handle-outline" size={50} color={PURPLE} /></View><Text style={styles.emptyTitle}>Your dream cart is empty</Text><Text style={styles.emptyText}>Add anything you like. Your bank account stays untouched.</Text></View>;
  return <View style={styles.page}><Text style={styles.pageTitle}>Dream cart</Text><SimBadge /><ScrollView contentContainerStyle={{ paddingBottom: 250 }}><DestinationPicker value={destinationId} onChange={onDestination} disabled={busy}/><Text style={styles.description}>Each item gets its own fictional journey. Domestic: 3–4 days. International: 8–12 days. Sorting mix-ups may add 12 hours.</Text>
    {items.map((item, index) => <View key={`${item.id}-${index}`} style={styles.cartRow}><ProductImage item={item} style={styles.cartImage} /><View style={{ flex: 1 }}><Text style={styles.cartName}>{item.name}</Text><Text style={styles.cartMeta}>{item.color}{item.selectedSize?` · Size ${item.selectedSize}`:""} · Virtual item</Text><Text style={styles.cartMeta}>From {city(item.originId).name} · {city(item.originId).country === city(destinationId).country ? "3–4 days" : "8–12 days"}</Text><Text style={styles.cartPrice}>{money(item.price)} USD</Text></View><Pressable disabled={busy} onPress={() => onRemove(index)}><Ionicons name="close-circle" size={23} color="#B8B2C0" /></Pressable></View>)}
    <View style={styles.receipt}><View style={styles.rowBetween}><Text style={styles.receiptLabel}>Virtual subtotal</Text><Text style={styles.receiptValue}>{money(total)}</Text></View><View style={styles.rowBetween}><Text style={styles.receiptLabel}>Real charge</Text><Text style={styles.free}>$0.00</Text></View></View>
  </ScrollView><View style={styles.cartCheckout}><Pressable style={styles.addButton} disabled={busy} onPress={onCheckout}><Text style={styles.addButtonText}>Continue to checkout · $0 charged</Text><Ionicons name="arrow-forward" size={20} color="white" /></Pressable></View></View>;
}

function SwipePay({ items, onCancel, onComplete, destinationId, busy, error }) {
  const x = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const max = Math.max(0, trackWidth - 68);
  const latest = useRef({ onComplete, max, itemCount: items.length });
  latest.current = { onComplete, max, itemCount: items.length };
  const submit = () => {
    if (completed.current || !latest.current.itemCount) return;
    completed.current = true;
    // Commit immediately: navigation does not depend on an animation callback.
    Promise.resolve().then(() => latest.current.onComplete()).then(() => safeHaptic()).catch(() => {
      completed.current = false;
      x.setValue(0);
    });
  };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { x.stopAnimation(); x.setValue(0); },
    onPanResponderMove: (_, g) => {
      x.setValue(Math.max(0, Math.min(latest.current.max, g.dx)));
    },
    onPanResponderRelease: (_, g) => {
      const travel = latest.current.max;
      if (travel > 0 && g.dx >= Math.min(110, travel * 0.45)) submit();
      else Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: false }).start(),
  }), [x]);
  const total = items.reduce((s, x) => s + x.price, 0);
  return <SafeAreaView style={styles.checkoutPage}><StatusBar style="light" />
    <View style={styles.checkoutTop}><Pressable disabled={busy} onPress={onCancel}><Ionicons name="close" size={28} color="white" /></Pressable><Text style={styles.checkoutTopText}>SIMULATED CHECKOUT</Text><View style={{ width: 28 }} /></View>
    <ScrollView contentContainerStyle={styles.checkoutContent}><View style={styles.lock}><Ionicons name="shield-checkmark" size={36} color={PURPLE} /></View><Text style={styles.checkoutTitle}>Send it on an adventure</Text><Text style={styles.checkoutSub}>This gesture creates a virtual order only. Nothing is charged, purchased, shipped, or delivered.</Text>
      <View style={styles.bigTotal}><Text style={styles.bigTotalLabel}>DREAM TOTAL</Text><Text style={styles.bigTotalValue}>{money(total)}</Text><Text style={styles.realTotal}>REAL CHARGE · $0.00</Text></View>
      <View testID="checkout-swipe" onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)} {...pan.panHandlers} style={styles.swipeTrack}><Text pointerEvents="none" style={styles.swipeText}>Swipe to place virtual order</Text><Animated.View pointerEvents="none" style={[styles.swipeKnob, { transform: [{ translateX: x }] }]}><Ionicons name="chevron-forward" size={28} color={PURPLE} /></Animated.View></View>
      <Pressable testID="checkout-confirm" accessibilityRole="button" disabled={busy} onPress={submit} style={styles.confirmAlternative}><Text style={styles.sectionLink}>Or tap to place virtual order</Text></Pressable>
      <Text style={styles.checkoutLegal}>Delivery city: {city(destinationId).name}, {city(destinationId).countryName}. Each package takes 3–4 domestic days or 8–12 international days, plus any playful delay.</Text>
      {busy && <Text style={styles.description}>Saving your adventure…</Text>}
      {error && <Text accessibilityRole="alert" style={{color:'#b53737',padding:12}}>{error}</Text>}
      <Text style={styles.checkoutLegal}>For entertainment only. CartPlay does not process payment or fulfill products.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Success({ visible, order, onTrack }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => { if (visible) Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start(); else scale.setValue(0.4); }, [visible]);
  return <View style={styles.successOverlay}><Animated.View style={[styles.successCard, { transform: [{ scale }] }]}><View style={styles.successBurst}><Ionicons name="sparkles" size={42} color="white" /></View><Text style={styles.successTitle}>Dream secured!</Text><Text style={styles.successText}>Your virtual order {order?.id} is saved. {order?.shipments?.length} package adventure(s) await. You spent exactly $0.</Text><View style={styles.pointsPill}><Ionicons name="flash" size={18} color="#F5A623" /><Text style={styles.pointsText}>+{order?.points || 0} Joy Points</Text></View><Pressable style={styles.addButton} onPress={onTrack}><Text style={styles.addButtonText}>Track my packages</Text><Ionicons name="arrow-forward" size={20} color="white" /></Pressable></Animated.View></View>;
}

function BottomNav({ tab, setTab, cartCount }) {
  const tabs = [["home", "Home"], ["search", "Discover"], ["bag", "Cart"], ["cube", "Orders"], ["person", "Me"]];
  return <View style={styles.nav}>{tabs.map(([icon, label]) => <Pressable key={label} style={styles.navItem} onPress={() => setTab(label)}><View>{label === "Cart" && cartCount > 0 && <View style={styles.navBadge}><Text style={styles.navBadgeText}>{cartCount}</Text></View>}<Ionicons name={tab === label ? icon : `${icon}-outline`} size={23} color={tab === label ? PURPLE : "#97919E"} /></View><Text style={[styles.navLabel, tab === label && styles.navLabelActive]}>{label}</Text></Pressable>)}</View>;
}

export default function App() {
  const {game,busy,error,change,retry}=useGame();
  const [tab,setTab]=useState('Home'),[product,setProduct]=useState(null),[checkoutStage,setCheckoutStage]=useState('closed'),[order,setOrder]=useState(null),[policyOpen,setPolicyOpen]=useState(false);
  const submitted=useRef(false);
  const save=update=>change(update).catch(()=>{});
  const add=item=>change(g=>({...g,cart:[...g.cart,item]})).then(()=>safeHaptic('light'));
  const favorite=id=>save(g=>{const list=g.favorites||[];return {...g,favorites:list.includes(id)?list.filter(x=>x!==id):[...list,id]};});
  const startCheckout=()=>{if(!game?.cart.length||busy)return;submitted.current=false;setCheckoutStage('payment');};
  const trackOrder=()=>{setCheckoutStage('closed');setTab('Orders');};
  const closeCheckout=()=>{if(busy)return;if(checkoutStage==='success')trackOrder();else setCheckoutStage('closed');};
  const complete=async()=>{
    if(submitted.current||!game?.cart.length||checkoutStage!=='payment')return;
    submitted.current=true;
    let created;
    try {
      await change(g=>{created=createOrder(g.cart,g.destinationId);return {...g,cart:[],orders:[created,...g.orders],points:g.points+created.points};});
      setOrder(created);setCheckoutStage('success');
    } catch(e) {submitted.current=false;throw e;}
  };
  const destination=id=>save(g=>({...g,destinationId:id}));
  const unbox=id=>save(g=>{const result=openShipment(g.orders,id);return {...g,orders:result.orders,points:g.points+result.points};});
  if(!game)return <SafeAreaView style={styles.app}><View style={styles.empty}><Text style={styles.emptyTitle}>{error?'Your game needs a retry':'Opening your playroom…'}</Text>{error&&<><Text style={styles.description}>{error}</Text><Pressable onPress={retry} style={styles.addButton}><Text style={styles.addButtonText}>Retry loading</Text></Pressable></>}</View></SafeAreaView>;
  if(game.consent?.version!==POLICY_VERSION)return <Policy busy={busy} error={error} onAccept={()=>save(g=>({...g,consent:{version:POLICY_VERSION,acceptedAt:Date.now()}}))}/>;
  if(policyOpen)return <Policy readOnly onClose={()=>setPolicyOpen(false)}/>;
  let content=<Home onOpen={setProduct} onAdd={add} cartCount={game.cart.length} favorites={game.favorites||[]} onFavorite={favorite} onCart={()=>setTab("Cart")}/>;
  if(tab==='Discover')content=<Discover onOpen={setProduct} onAdd={add} cartCount={game.cart.length} favorites={game.favorites||[]} onFavorite={favorite} onCart={()=>setTab("Cart")}/>;
  if(tab==='Cart')content=<Cart items={game.cart} onRemove={index=>save(g=>({...g,cart:g.cart.filter((_,i)=>i!==index)}))} onCheckout={startCheckout} destinationId={game.destinationId} onDestination={destination} busy={busy}/>;
  if(tab==='Orders')content=<Orders orders={game.orders} quiet={game.quiet} onUnbox={unbox} busy={busy}/>;
  if(tab==='Me')content=<Playroom game={game} onDestination={destination} onQuiet={quiet=>save(g=>({...g,quiet}))} onPolicy={()=>setPolicyOpen(true)} busy={busy} onReset={()=>save(()=>emptyGame()).then(()=>{setTab('Home');setCheckoutStage('closed');setOrder(null);setProduct(null);})}/>;
  return <SafeAreaView style={styles.app}><StatusBar style="dark"/>
    {error&&<Text accessibilityRole="alert" style={{color:'#b53737',padding:12}}>{error}</Text>}
    {content}<BottomNav tab={tab} setTab={setTab} cartCount={game.cart.length}/>
    <ProductModal product={product} onClose={()=>setProduct(null)} onAdd={add} favorites={game.favorites||[]} onFavorite={favorite}/>
    <Modal testID="checkout-modal" visible={checkoutStage!=='closed'} animationType="slide" onRequestClose={closeCheckout}>
      {checkoutStage==='payment'&&<SwipePay items={game.cart} destinationId={game.destinationId} busy={busy} error={error} onCancel={closeCheckout} onComplete={complete}/>}
      {checkoutStage==='success'&&<Success visible order={order} onTrack={trackOrder}/>}
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  confirmAlternative: { padding: 16, marginTop: 8 },
  app: { flex: 1, backgroundColor: BG }, scrollBody: { padding: 20, paddingBottom: 120 }, page: { flex: 1, paddingHorizontal: 20, paddingTop: 18, backgroundColor: BG },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, eyebrow: { color: MUTED, fontSize: 10, letterSpacing: 1.8, fontWeight: "800" }, logo: { color: INK, fontSize: 30, fontWeight: "900", letterSpacing: -1.4 }, headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "white", alignItems: "center", justifyContent: "center" }, cartDot: { position: "absolute", right: -2, top: -2, backgroundColor: "#FF5D7A", borderRadius: 10, minWidth: 19, height: 19, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: BG }, cartDotText: { color: "white", fontWeight: "800", fontSize: 9 },
  simBadge: { alignSelf: "flex-start", flexDirection: "row", gap: 5, alignItems: "center", borderWidth: 1, borderColor: "#DCD3FF", backgroundColor: "#F0ECFF", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, marginVertical: 8 }, simText: { color: PURPLE, fontSize: 9, fontWeight: "900", letterSpacing: .7 },
  hero: { marginTop: 10, padding: 20, minHeight: 180, backgroundColor: PURPLE, borderRadius: 28, flexDirection: "row", overflow: "hidden" }, heroKicker: { color: "#CFC4FF", fontSize: 10, letterSpacing: 1.4, fontWeight: "900" }, heroTitle: { color: "white", fontSize: 27, lineHeight: 31, fontWeight: "900", marginTop: 13, letterSpacing: -.8 }, heroNote: { color: "#DDD6FF", fontSize: 12, marginTop: 10 }, heroOrb: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#886CFF", alignItems: "center", justifyContent: "center", alignSelf: "center", transform: [{ rotate: "-12deg" }] },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 27, marginBottom: 12 }, sectionTitle: { color: INK, fontSize: 19, fontWeight: "900", letterSpacing: -.4, marginTop: 24, marginBottom: 14 }, sectionLink: { color: MUTED, fontSize: 12 }, chips: { gap: 9, paddingBottom: 18 }, chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: "white", borderWidth: 1, borderColor: "#EBE7EF" }, chipActive: { backgroundColor: INK, borderColor: INK }, chipText: { color: MUTED, fontWeight: "700" }, chipTextActive: { color: "white" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, card: { width: (width - 52) / 2, backgroundColor: "white", borderRadius: 20, overflow: "hidden", marginBottom: 2 }, compactCard: { flex: 1, width: undefined }, productImage: { width: "100%", height: 155, backgroundColor: "#E9E5EC" }, compactImage: { height: 145 }, cardBody: { padding: 12 }, category: { color: PURPLE, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, productName: { color: INK, fontSize: 14, fontWeight: "800", marginTop: 5, marginBottom: 9 }, price: { color: INK, fontSize: 15, fontWeight: "900" }, simCurrency: { color: PURPLE, fontSize: 8, letterSpacing: .5 }, plus: { backgroundColor: PURPLE, borderRadius: 15, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  pageTitle: { color: INK, fontSize: 29, fontWeight: "900", letterSpacing: -1 }, subtitle: { color: MUTED, fontSize: 13, marginTop: 4, marginBottom: 18 }, search: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 17, backgroundColor: "white", paddingHorizontal: 15, marginBottom: 18, borderWidth: 1, borderColor: "#ECE8F0" }, searchInput: { flex: 1, height: 50, color: INK, fontSize: 15 },
  modalPage: { flex: 1, backgroundColor: BG }, modalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }, circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "white", alignItems: "center", justifyContent: "center" }, detailImageButton:{position:'relative'}, detailImage: { width: "100%", height: 370, backgroundColor: "#EAE5ED" }, zoomHint:{position:'absolute',right:14,bottom:14,backgroundColor:'rgba(25,23,36,.76)',borderRadius:18,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6},zoomHintText:{color:'white',fontSize:11,fontWeight:'800'}, imageViewer:{...StyleSheet.absoluteFillObject,zIndex:50,elevation:50,backgroundColor:'#111015',paddingTop:12},viewerTop:{height:58,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},viewerCircle:{width:44,height:44,borderRadius:22,backgroundColor:'#302e37',alignItems:'center',justifyContent:'center'},viewerTitle:{color:'white',fontWeight:'800',fontSize:14,maxWidth:'68%'},viewerStage:{flex:1,alignItems:'center',justifyContent:'center',overflow:'hidden'},viewerImage:{width:width,height:Math.min(width*1.34,540),backgroundColor:'#fff'},viewerControls:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:14,paddingTop:14},viewerControl:{width:48,height:48,borderRadius:24,backgroundColor:'#34313a',alignItems:'center',justifyContent:'center'},viewerZoom:{color:'white',fontWeight:'900',width:52,textAlign:'center'},viewerReset:{paddingHorizontal:14,paddingVertical:10,borderRadius:18,borderWidth:1,borderColor:'#65616b'},viewerResetText:{color:'white',fontSize:12,fontWeight:'800'},viewerNote:{color:'#aaa6b1',fontSize:10,lineHeight:15,textAlign:'center',paddingHorizontal:32,paddingTop:12,paddingBottom:18}, detailBody: { padding: 22 }, detailTitle: { color: INK, fontSize: 29, fontWeight: "900", marginTop: 8, letterSpacing: -.8 }, rating: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 11 }, ratingText: { color: MUTED, fontWeight: "600", fontSize: 13 }, detailPrice: { color: INK, fontSize: 23, fontWeight: "900", marginTop: 19 }, description: { color: MUTED, fontSize: 14, lineHeight: 22, marginTop: 16 }, rewardBox: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#F0ECFF", borderRadius: 16, padding: 15, marginTop: 20 }, rewardTitle: { color: INK, fontWeight: "800" }, rewardNote: { color: MUTED, fontSize: 11, marginTop: 2 }, sticky: { padding: 16, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#ECE8F0" }, addButton: { backgroundColor: PURPLE, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }, addButtonText: { color: "white", fontWeight: "900", fontSize: 15 }, microcopy: { textAlign: "center", color: MUTED, fontSize: 10, marginTop: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 45, backgroundColor: BG }, emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#EEE9FF", alignItems: "center", justifyContent: "center", marginBottom: 20 }, emptyTitle: { color: INK, fontSize: 21, fontWeight: "900", textAlign: "center" }, emptyText: { color: MUTED, textAlign: "center", lineHeight: 20, marginTop: 9 }, cartRow: { flexDirection: "row", gap: 13, backgroundColor: "white", borderRadius: 18, padding: 12, marginTop: 12, alignItems: "center" }, cartImage: { width: 76, height: 76, borderRadius: 13 }, cartName: { color: INK, fontWeight: "800", fontSize: 14 }, cartMeta: { color: MUTED, fontSize: 11, marginTop: 5 }, cartPrice: { color: PURPLE, fontWeight: "900", marginTop: 8 }, receipt: { backgroundColor: "#ECE7FF", borderRadius: 19, padding: 18, gap: 13, marginTop: 18 }, receiptLabel: { color: MUTED, fontWeight: "600" }, receiptValue: { color: INK, fontWeight: "900" }, free: { color: "#178C65", fontWeight: "900" }, cartCheckout: { position: "absolute", bottom: 84, left: 0, right: 0, backgroundColor: "white", padding: 16, borderTopWidth: 1, borderColor: "#ECE8F0" },
  checkoutPage: { flex: 1, backgroundColor: INK }, checkoutTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 19 }, checkoutTopText: { color: "#C8C1D0", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, checkoutContent: { flexGrow: 1, paddingBottom: 40, backgroundColor: BG, borderTopLeftRadius: 34, borderTopRightRadius: 34, padding: 24, alignItems: "center" }, lock: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#EDE8FF", alignItems: "center", justifyContent: "center", marginTop: 28 }, checkoutTitle: { color: INK, fontSize: 27, fontWeight: "900", marginTop: 19 }, checkoutSub: { color: MUTED, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 9, maxWidth: 320 }, bigTotal: { width: "100%", alignItems: "center", backgroundColor: "white", borderRadius: 24, padding: 24, marginTop: 27 }, bigTotalLabel: { color: MUTED, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, bigTotalValue: { color: INK, fontSize: 42, fontWeight: "900", letterSpacing: -1.5, marginTop: 7 }, realTotal: { color: "#178C65", fontSize: 10, fontWeight: "900", marginTop: 7, letterSpacing: .7 }, swipeTrack: { width: "100%", height: 68, borderRadius: 34, backgroundColor: "#DED7FA", marginTop: 36, justifyContent: "center", padding: 6, overflow: "hidden" }, swipeText: { position: "absolute", alignSelf: "center", color: "#5E4EA4", fontWeight: "800", fontSize: 13 }, swipeKnob: { width: 56, height: 56, borderRadius: 28, backgroundColor: "white", alignItems: "center", justifyContent: "center", shadowColor: "#321B91", shadowOpacity: .2, shadowRadius: 9, elevation: 5 }, checkoutLegal: { color: MUTED, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 18, paddingHorizontal: 20 },
  successOverlay: { flex: 1, backgroundColor: "rgba(25,23,36,.7)", justifyContent: "center", padding: 22 }, successCard: { backgroundColor: "white", borderRadius: 30, padding: 25, alignItems: "center" }, successBurst: { width: 90, height: 90, borderRadius: 45, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center", marginTop: 3 }, successTitle: { color: INK, fontSize: 28, fontWeight: "900", marginTop: 20 }, successText: { color: MUTED, textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 15 }, pointsPill: { flexDirection: "row", gap: 7, backgroundColor: "#FFF5D9", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 22 }, pointsText: { color: "#8A5B00", fontWeight: "900" },
  orderCard: { backgroundColor: "white", borderRadius: 24, overflow: "hidden", marginTop: 13 }, orderHero: { width: "100%", height: 190 }, orderInfo: { padding: 17 }, orderTitle: { color: INK, fontSize: 21, fontWeight: "900", marginTop: 7 }, orderEta: { color: "#178C65", fontWeight: "700", fontSize: 12, marginTop: 7 }, timeline: { backgroundColor: "white", borderRadius: 22, padding: 18 }, timelineRow: { flexDirection: "row", minHeight: 76, gap: 14 }, timelineRail: { alignItems: "center", width: 32 }, timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" }, timelineDotFuture: { backgroundColor: "#EEEAF1" }, timelineLine: { flex: 1, width: 3, backgroundColor: PURPLE }, timelineTitle: { color: INK, fontWeight: "800", marginTop: 5 }, timelineNote: { color: MUTED, fontSize: 11, marginTop: 4 }, disclaimer: { flexDirection: "row", gap: 9, backgroundColor: "#F0ECFF", borderRadius: 16, padding: 14, marginTop: 16 }, disclaimerText: { color: "#5E527A", fontSize: 11, lineHeight: 16, flex: 1 },
  profileTop: { alignItems: "center", paddingTop: 10 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center", marginBottom: 13 }, avatarText: { color: "white", fontSize: 24, fontWeight: "900" }, stats: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: INK, borderRadius: 22, paddingVertical: 21, marginTop: 12 }, statValue: { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center" }, statLabel: { color: "#AFA9BA", fontSize: 8, fontWeight: "800", marginTop: 5 }, statDivider: { width: 1, height: 35, backgroundColor: "#484251" }, setting: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", padding: 14, borderRadius: 17, marginBottom: 10 }, settingIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }, settingTitle: { color: INK, fontWeight: "800" }, settingNote: { color: MUTED, fontSize: 11, marginTop: 3 },
  nav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 84, paddingTop: 11, paddingBottom: 13, backgroundColor: "white", flexDirection: "row", borderTopWidth: 1, borderTopColor: "#ECE8F0" }, navItem: { flex: 1, alignItems: "center", gap: 4 }, navLabel: { color: "#97919E", fontSize: 9, fontWeight: "700" }, navLabelActive: { color: PURPLE }, navBadge: { position: "absolute", zIndex: 2, right: -9, top: -6, backgroundColor: "#FF5D7A", minWidth: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center" }, navBadgeText: { color: "white", fontSize: 8, fontWeight: "900" },
});
