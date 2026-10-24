// Gift artwork registry: replace an image here (or add an animation URL) without touching the live screen.
import love from '@/assets/gifts/love.png';
import rose from '@/assets/gifts/rose.png';
import coffee from '@/assets/gifts/coffee.png';
import heart from '@/assets/gifts/heart.png';
import treasure from '@/assets/gifts/treasure.png';
import donut from '@/assets/gifts/donut.png';
import sunglasses from '@/assets/gifts/sunglasses.png';
import perfume from '@/assets/gifts/perfume.png';
import bouquet from '@/assets/gifts/bouquet.png';
import crown from '@/assets/gifts/crown.png';
import diamond from '@/assets/gifts/diamond.png';
import car from '@/assets/gifts/car.png';

const ART: Record<string, string> = { love, rose, coffee, heart, treasure, donut, sunglasses, perfume, bouquet, crown, diamond, car };
export const giftArt = (id?: string | null) => (id ? ART[id] : undefined);
