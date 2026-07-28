/**
 * Category / Color / Print Mapping Tables
 *
 * Maps Zara's taxonomy to our internal product categories.
 * Edit these mappings as you discover mismatches.
 *
 * How to update:
 * 1. Open browser devtools → Network → XHR
 * 2. Browse Zara category pages and note their category names
 * 3. Add entries below mapping their names → our internal names
 */

export interface CategoryMapping {
  /** Zara category name (case-insensitive) → our internal category */
  categoryMap: Record<string, string>;
  /** Zara subcategory name → our internal subcategory */
  subcategoryMap: Record<string, string>;
  /** Zara color name → our internal color */
  colorMap: Record<string, string>;
  /** Zara print/pattern name → our internal print */
  printMap: Record<string, string>;
}

const categoryMapping: CategoryMapping = {
  // ── Category Mapping (Zara → Internal) ──
  categoryMap: {
    // Tops
    't-shirts': 'tops',
    'shirts': 'tops',
    'polos': 'tops',
    'blouses': 'tops',
    'knitwear': 'tops',
    'knits': 'tops',
    'sweaters': 'tops',
    'sweatshirts': 'tops',
    'tops': 'tops',
    'camisoles': 'tops',
    'bodysuits': 'tops',
    'tanks': 'basics',

    // Bottoms
    'trousers': 'bottoms',
    'jeans': 'bottoms',
    'shorts': 'bottoms',
    'skirts': 'bottoms',
    'leggings': 'bottoms',
    'joggers': 'bottoms',
    'bottoms': 'bottoms',

    // Outerwear
    'jackets': 'outerwear',
    'coats': 'outerwear',
    'blazers': 'outerwear',
    'gilets': 'outerwear',
    'parkas': 'outerwear',
    'bomber': 'outerwear',
    'vests': 'outerwear',
    'outerwear': 'outerwear',

    // Basics
    'basics': 'basics',
    'basic': 'basics',
    'athletic': 'basics',
    'activewear': 'basics',
    'loungewear': 'basics',

    // Dresses
    'dresses': 'dresses',
    'jumpsuits': 'dresses',
    'playsuits': 'dresses',

    // Accessories
    'accessories': 'accessories',
    'bags': 'accessories',
    'hats': 'accessories',
    'scarves': 'accessories',
    'belts': 'accessories',
    'jewellery': 'accessories',
    'jewelry': 'accessories',
    'sunglasses': 'accessories',
    'hair accessories': 'accessories',
  },

  // ── Subcategory Mapping (Zara → Internal) ──
  subcategoryMap: {
    // Tops
    't-shirt': 't-shirt',
    'polo': 'polo',
    'shirt': 'shirt',
    'blouse': 'blouse',
    'knit': 'knit',
    'knitwear': 'knit',
    'sweater': 'knit',
    'sweatshirt': 'hoodie',
    'hoodie': 'hoodie',
    'crop top': 't-shirt',

    // Bottoms
    'jeans': 'jeans',
    'trousers': 'trousers',
    'chinos': 'trousers',
    'shorts': 'shorts',
    'skirt': 'skirt',
    'skirts': 'skirt',
    'leggings': 'leggings',
    'joggers': 'joggers',

    // Outerwear
    'jacket': 'jacket',
    'coat': 'coat',
    'blazer': 'jacket',
    'bomber': 'bomber',
    'parka': 'parka',
    'puffer': 'jacket',
    'gilet': 'jacket',

    // Basics
    'tank': 'tank-top',
    'tank top': 'tank-top',
    'camisole': 'tank-top',

    // Dresses
    'dress': 'midi-dress',
    'mini dress': 'mini-dress',
    'midi dress': 'midi-dress',
    'maxi dress': 'midi-dress',
    'shirt dress': 'shirt-dress',
    'jumpsuit': 'midi-dress',

    // Accessories
    'hat': 'hat',
    'bucket hat': 'hat',
    'cap': 'hat',
    'scarf': 'scarf',
    'belt': 'belt',
    'bag': 'bag',
    'tote': 'bag',
    'crossbody': 'bag',
  },

  // ── Color Mapping (Zara → Internal) ──
  colorMap: {
    // Basic
    black: 'black',
    white: 'white',
    grey: 'grey',
    gray: 'grey',
    'dark grey': 'grey',
    'dark gray': 'grey',
    charcoal: 'charcoal',

    // Blues
    navy: 'navy',
    'navy blue': 'navy',
    blue: 'blue',
    'dark blue': 'navy',
    'light blue': 'blue',
    denim: 'blue',

    // Earth tones
    beige: 'beige',
    cream: 'cream',
    camel: 'beige',
    khaki: 'khaki',
    taupe: 'beige',
    sand: 'beige',

    // Greens
    olive: 'olive',
    'olive green': 'olive',
    green: 'olive',
    sage: 'sage',
    forest: 'olive',

    // Reds / warm
    red: 'red',
    burgundy: 'burgundy',
    wine: 'burgundy',
    rust: 'rust',
    terracotta: 'rust',
    coral: 'red',

    // Pinks
    pink: 'pink',
    'dusty pink': 'pink',
    blush: 'pink',
    rose: 'pink',
    fuchsia: 'pink',

    // Other
    brown: 'rust',
    tan: 'beige',
    lavender: 'sage',
    purple: 'burgundy',
    yellow: 'cream',
    orange: 'rust',
  },

  // ── Print Mapping (Zara → Internal) ──
  printMap: {
    solid: 'solid',
    plain: 'solid',
    'solid colour': 'solid',
    stripe: 'stripes',
    striped: 'stripes',
    stripes: 'stripes',
    check: 'check',
    checked: 'check',
    plaid: 'check',
    gingham: 'check',
    floral: 'floral',
    flowers: 'floral',
    animal: 'animal-print',
    'animal print': 'animal-print',
    leopard: 'animal-print',
    snake: 'animal-print',
    zebra: 'animal-print',
    graphic: 'graphic',
    logo: 'graphic',
    print: 'graphic',
    camo: 'camo',
    camouflage: 'camo',
    'tie-dye': 'tie-dye',
    'tie dye': 'tie-dye',
    abstract: 'graphic',
    geometric: 'graphic',
  },
};

export default categoryMapping;
