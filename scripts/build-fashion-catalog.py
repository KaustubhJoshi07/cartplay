"""Rebuild the curated archive from the two source parquet shards (paths as args).
Source: https://huggingface.co/datasets/ashraq/fashion-product-images-small
Requires pyarrow and Pillow; not required to run the app.
"""
import sys,json,io,re,collections,random
from pathlib import Path
import pyarrow.parquet as pq
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
MAP={'Dresses':'Dresses','Tops':'Tops','Tshirts':'T-shirts','Shirts':'Shirts & blouses','Jeans':'Jeans','Jeggings':'Jeggings','Skirts':'Skirts','Shorts':'Shorts','Trousers':'Pants','Capris':'Capris','Leggings':'Leggings','Sweaters':'Sweaters','Shrug':'Cardigans & shrugs','Sweatshirts':'Sweatshirts','Jackets':'Jackets','Blazers':'Blazers','Waistcoat':'Vests','Jumpsuit':'Jumpsuits','Track Pants':'Activewear','Tracksuits':'Activewear','Camisoles':'Camisoles','Nightdress':'Nightwear','Night suits':'Nightwear','Lounge Pants':'Loungewear','Lounge Shorts':'Loungewear','Lounge Tshirts':'Loungewear','Bath Robe':'Robes','Robe':'Robes','Swimwear':'Swimwear','Bra':'Bras','Briefs':'Underwear','Shapewear':'Shapewear','Socks':'Socks & tights','Stockings':'Socks & tights','Tights':'Socks & tights','Kurtas':'Kurtas','Kurtis':'Kurtis','Tunics':'Tunics','Kurta Sets':'Ethnic sets','Sarees':'Sarees','Lehenga Choli':'Ethnic sets','Patiala':'Ethnic bottoms','Salwar':'Ethnic bottoms','Churidar':'Ethnic bottoms','Salwar and Dupatta':'Ethnic sets','Dupatta':'Dupattas','Heels':'Heels','Flats':'Flats','Casual Shoes':'Sneakers','Sports Shoes':'Sports shoes','Sandals':'Sandals','Sports Sandals':'Sandals','Flip Flops':'Sandals','Handbags':'Handbags','Clutches':'Clutches','Backpacks':'Backpacks','Wallets':'Wallets','Belts':'Belts','Scarves':'Scarves','Stoles':'Scarves','Mufflers':'Scarves','Sunglasses':'Sunglasses','Watches':'Watches','Earrings':'Earrings','Necklace and Chains':'Necklaces','Pendant':'Necklaces','Bangle':'Bracelets','Bracelet':'Bracelets','Ring':'Rings','Jewellery Set':'Jewelry sets','Caps':'Hats','Hair Accessory':'Hair accessories'}
CAP={'Dresses':50,'Tops':45,'T-shirts':35,'Shirts & blouses':30,'Jeans':35,'Kurtas':35,'Kurtis':25,'Ethnic sets':25,'Handbags':30,'Heels':30,'Sneakers':25,'Flats':25,'Sports shoes':20,'Bras':18,'Underwear':15,'Nightwear':28,'Sarees':30}
rows=[]
for file in sys.argv[1:]:
 table=pq.read_table(file)
 indices=[i for i,r in enumerate(table.select(['gender','articleType']).to_pylist()) if r['gender']=='Women' and r['articleType'] in MAP]
 rows.extend(table.take(indices).to_pylist())
rng=random.Random(31226);rng.shuffle(rows)
groups=collections.defaultdict(list);names=set();ids=set()
for r in rows:
 cat=MAP[r['articleType']];name=r['productDisplayName'] or ''
 canonical=re.sub(r'\W','',name.lower())
 if not name or canonical in names or r['id'] in ids or len(groups[cat])>=CAP.get(cat,16):continue
 blob=r['image']['bytes']
 if not blob:continue
 try:
  image=Image.open(io.BytesIO(blob));image.verify()
 except Exception:continue
 names.add(canonical);ids.add(r['id']);groups[cat].append(r)
priority=['Dresses','Tops','Jeans','Shirts & blouses','Heels','Handbags','Skirts','T-shirts','Kurtas','Sneakers','Ethnic sets','Jackets','Nightwear']
ordered=priority+sorted(set(groups)-set(priority));selected=[]
for i in range(max(map(len,groups.values()))):
 for cat in ordered:
  if i<len(groups[cat]):selected.append(groups[cat][i])
shoes={'Heels','Flats','Sneakers','Sports shoes','Sandals'}
accessories={'Handbags','Clutches','Backpacks','Wallets','Belts','Scarves','Sunglasses','Watches','Earrings','Necklaces','Bracelets','Rings','Jewelry sets','Hats','Hair accessories','Dupattas'}
origins=['newyork','mumbai','copenhagen','losangeles','shenzhen','tokyo','chicago','london']
products=[];requires=[]
for i,r in enumerate(selected):
 cat=MAP[r['articleType']];identity=f"fashion-{r['id']}";blob=r['image']['bytes'];(ROOT/'assets/fashion'/f'{identity}.jpg').write_bytes(blob)
 requires.append(f"  '{identity}': require('./fashion/{identity}.jpg')")
 occasion='Everyday'
 if r['usage']=='Ethnic':occasion='Traditional'
 elif r['usage']=='Formal':occasion='Work'
 elif r['usage']=='Sports' or cat in {'Activewear','Sports shoes'}:occasion='Workout'
 elif cat in {'Nightwear','Loungewear','Robes','Underwear','Bras','Shapewear'}:occasion='At home'
 elif cat in {'Swimwear','Sandals','Hats'}:occasion='Vacation'
 elif r['usage']=='Party' or cat in {'Heels','Clutches','Jewelry sets'}:occasion='Party'
 price=round((19 if cat in accessories else 29 if cat in shoes else 14)+(r['id']%9)*5+.99,2)
 sizes=['One size'] if cat in accessories else [f'US {n}' for n in range(5,12)] if cat in shoes else ['XS','S','M','L','XL','2XL','3XL']
 color=r['baseColour'] or 'As pictured'
 name=r['productDisplayName'].replace('Women\'s ','').replace('Womens ','').replace('Women ','')
 products.append(dict(id=identity,name=name,category=cat,isFashion=True,price=price,reward=max(5,round(price/5)),color=color,originId=origins[i%len(origins)],imageKey=identity,sizes=sizes,occasion=occasion,sourceName='Fashion inspiration archive',sourceUrl='https://huggingface.co/datasets/ashraq/fashion-product-images-small',sourceChecked='2026-09-12',sourceYear=int(r['year']) if r.get('year') else None,sourceProductName=r['productDisplayName'],description=f"{color} {cat.lower()} inspiration for your virtual wardrobe. Select a game size, save the look, or send it on a package adventure.",priceType='Illustrative USD game price',tags=[r.get('season') or '',r['articleType'],occasion]))
(ROOT/'fashion-catalog.json').write_text(json.dumps(products,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/fashion-images.js').write_text('// Bundled reference thumbnails; see SOURCE-NOTES.md.\nexport default {\n'+',\n'.join(requires)+'\n};\n')
print('PRODUCTS',len(products),'CATEGORIES',len(groups))
print(json.dumps({k:len(v) for k,v in sorted(groups.items())}))
# Contact sheet for a visual check of source labels and images.
from PIL import ImageDraw
sample=[groups[c][0] for c in ordered]
out=Image.new('RGB',(8*150,((len(sample)+7)//8)*180),'#f6f0f3');draw=ImageDraw.Draw(out)
for i,r in enumerate(sample):
 im=Image.open(io.BytesIO(r['image']['bytes'])).convert('RGB');im.thumbnail((130,145));x=(i%8)*150;y=(i//8)*180;out.paste(im,(x+(150-im.width)//2,y));draw.text((x+4,y+150),MAP[r['articleType']][:23],fill='black')
out.save('/tmp/fashion-contact.jpg')
