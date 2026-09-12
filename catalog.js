import FASHION_PRODUCTS from './fashion-catalog.json';
// Product identities and image URLs sourced from the listed Amazon pages.
// Prices and shipping origins are fictional, not a live Amazon feed.
const ORIGINAL_PRODUCTS = [
  {
    "id": "sony",
    "name": "Sony WH-CH520 Headphones",
    "category": "Tech",
    "price": 59.99,
    "reward": 12,
    "color": "Black",
    "originId": "tokyo",
    "sourceUrl": "https://www.amazon.com/dp/B0BS1PRC4L",
    "description": "Wireless on-ear headphones with Bluetooth and a built-in microphone.",
    "image": "https://m.media-amazon.com/images/I/41lArSiD5hL._AC_SL1200_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  },
  {
    "id": "lego",
    "name": "LEGO Botanicals Mini Orchid",
    "category": "Home",
    "price": 29.99,
    "reward": 8,
    "color": "Orchid",
    "originId": "copenhagen",
    "sourceUrl": "https://www.amazon.com/LEGO-Botanicals-Mini-Orchid-Building/dp/B0DJ19VGDD",
    "description": "A buildable orchid display with five open flowers and a terracotta-colored pot. Set 10343.",
    "image": "https://m.media-amazon.com/images/I/71NV9KyLMPL._AC_SL1500_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  },
  {
    "id": "kindle",
    "name": "Kindle Paperwhite 16 GB",
    "category": "Tech",
    "price": 159.99,
    "reward": 20,
    "color": "Black",
    "originId": "seattle",
    "sourceUrl": "https://www.amazon.com/dp/B0CTMS64NT",
    "description": "A 16 GB Kindle Paperwhite with a 7-inch glare-free display.",
    "image": "https://m.media-amazon.com/images/I/71zbjDbXatL._AC_SL1500_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  },
  {
    "id": "mouse",
    "name": "Logitech Pebble Mouse 2 M350s",
    "category": "Tech",
    "price": 29.99,
    "reward": 8,
    "color": "Tonal Rose",
    "originId": "shenzhen",
    "sourceUrl": "https://www.amazon.com/dp/B0BT4DXWQD",
    "description": "A compact Bluetooth mouse with quiet clicks and device switching.",
    "image": "https://m.media-amazon.com/images/I/61mrwx7vvsL._AC_SL1500_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  },
  {
    "id": "dumbbell",
    "name": "Amazon Basics Adjustable Dumbbell",
    "category": "Fitness",
    "price": 69.99,
    "reward": 14,
    "color": "25 lb \u00b7 Single",
    "originId": "chicago",
    "sourceUrl": "https://www.amazon.com/Amazon-Basics-Adjustable-Dumbbell-25/dp/B0FC6RZNK2",
    "description": "A single adjustable dumbbell with five weight options, from 5 to 25 pounds, plus a storage tray.",
    "image": "https://m.media-amazon.com/images/I/61WL-9Vt6oL._AC_SL1500_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  },
  {
    "id": "weights",
    "name": "Amazon Basics Dumbbell Set",
    "category": "Fitness",
    "price": 59.99,
    "reward": 12,
    "color": "38 lb set",
    "originId": "losangeles",
    "sourceUrl": "https://www.amazon.com/Amazon-Basics-Adjustable-Barbell-Dumbells/dp/B071WSFSGC",
    "description": "Adjustable dumbbell handles, plates, collars, and a storage case; 38 pounds total.",
    "image": "https://m.media-amazon.com/images/I/91QxtmB7tEL._AC_SL1500_.jpg",
    "sourceChecked": "2026-09-11",
    "priceType": "Illustrative USD game price"
  }
];

export const PRODUCTS = [...ORIGINAL_PRODUCTS, ...FASHION_PRODUCTS];
