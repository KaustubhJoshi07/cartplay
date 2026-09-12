export const SIZES = ['XS','S','M','L','XL','2XL','3XL'];
export function filterProducts(products,{query='',department='Fashion',category='All',color='All',size='All',occasion='All',sort='Featured',favoritesOnly=false,favorites=[]}={}) {
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const result=products.filter(p=> {
  if(department==='Fashion'&&!p.isFashion)return false;
  if(department==='Extras'&&p.isFashion)return false;
  if(category!=='All'&&p.category!==category)return false;
  if(color!=='All'&&p.color!==color)return false;
  if(size!=='All'&&!(p.sizes||[]).includes(size))return false;
  if(occasion!=='All'&&p.occasion!==occasion)return false;
  if(favoritesOnly&&!favorites.includes(p.id))return false;
  const hay=[p.name,p.category,p.color,p.occasion,p.description,...(p.tags||[])].join(' ').toLowerCase();
  return terms.every(t=>hay.includes(t));
 });
 if(sort==='Price ↑')result.sort((a,b)=>a.price-b.price||a.name.localeCompare(b.name));
 if(sort==='Price ↓')result.sort((a,b)=>b.price-a.price||a.name.localeCompare(b.name));
 if(sort==='A–Z')result.sort((a,b)=>a.name.localeCompare(b.name));
 return result;
}
export function makeSelection(product,size){
 if(product.sizes?.length&&!product.sizes.includes(size))throw Error('Choose a game size.');
 return {...product,...(size?{selectedSize:size}:{})};
}
