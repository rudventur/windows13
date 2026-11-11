/**
 * PIX mood words — the one-word "climate" of a PIX photo challenge.
 *
 * Every spin in the PIX PANEL picks ONE random word from this list and shows
 * it big on top of the camera feed. The emojis say WHAT to photograph and
 * WHERE; the mood word says HOW the photo should feel ("Misty", "Golden",
 * "Cosy", "Electric" ...).
 *
 * HOW TO GROW THE LIST
 *   Add words to any group below (or add a new group). Keep them:
 *     · one word (a hyphen is fine: "Old-school")
 *     · about mood, atmosphere, light, weather, feel, texture or setting
 *     · neutral: no political, religious or identity words
 *   Duplicates are removed automatically, so don't worry about repeats.
 *
 * Public API (window.PixMoods):
 *   LIST            — every word (deduplicated), in group order
 *   GROUPS          — { groupId: [words] }
 *   GROUP_LABEL     — { groupId: 'Readable name' }
 *   count()         — how many words there are
 *   pick()          — one random word (avoids the last few picks)
 *   groupOf(word)   — the group id a word belongs to
 */
(function (global) {
  'use strict';

  var GROUPS = {
    // Light and glow (50)
    light: [
      'Golden', 'Bright', 'Dim', 'Glowing', 'Radiant', 'Shadowy', 'Sunlit', 'Moonlit',
      'Starlit', 'Gleaming', 'Glittering', 'Shimmering', 'Sparkling', 'Twinkling', 'Luminous', 'Dazzling',
      'Hazy', 'Murky', 'Dusky', 'Silvery', 'Pearly', 'Amber', 'Rosy', 'Pastel',
      'Neon', 'Faded', 'Washed-out', 'Backlit', 'Silhouetted', 'Candlelit', 'Lamplit', 'Flickering',
      'Blazing', 'Fiery', 'Soft-lit', 'Contrasty', 'Dappled', 'Speckled', 'Streaky', 'Shady',
      'Glossy', 'Matte', 'Gilded', 'Coppery', 'Bronzed', 'Opal', 'Velvet', 'Inky',
      'Smoky', 'Twilight'
    ],
    // Weather and air (49)
    weather: [
      'Stormy', 'Misty', 'Foggy', 'Rainy', 'Drizzly', 'Snowy', 'Frosty', 'Icy',
      'Frozen', 'Windy', 'Breezy', 'Blustery', 'Gusty', 'Cloudy', 'Overcast', 'Sunny',
      'Muggy', 'Humid', 'Dewy', 'Damp', 'Soggy', 'Drenched', 'Thundery', 'Sultry',
      'Balmy', 'Scorching', 'Sweltering', 'Chilly', 'Nippy', 'Crisp', 'Brisk', 'Freezing',
      'Wintry', 'Summery', 'Springlike', 'Autumnal', 'Dusty', 'Sandy', 'Steamy', 'Tropical',
      'Arctic', 'Polar', 'Mild', 'Fresh', 'Clear', 'Bleak', 'Wet', 'Dry',
      'Parched'
    ],
    // Calm and soft (42)
    calm: [
      'Calm', 'Peaceful', 'Serene', 'Tranquil', 'Still', 'Quiet', 'Hushed', 'Silent',
      'Gentle', 'Mellow', 'Restful', 'Sleepy', 'Drowsy', 'Lazy', 'Slow', 'Idle',
      'Placid', 'Soothing', 'Relaxed', 'Easygoing', 'Soft', 'Tender', 'Delicate', 'Airy',
      'Light', 'Weightless', 'Floaty', 'Dreamy', 'Hypnotic', 'Meditative', 'Unhurried', 'Leisurely',
      'Breathless', 'Muted', 'Subtle', 'Simple', 'Minimal', 'Pure', 'Clean', 'Tidy',
      'Neat', 'Spare'
    ],
    // Cosy and homely (37)
    cosy: [
      'Cosy', 'Snug', 'Warm', 'Homely', 'Comfy', 'Toasty', 'Inviting', 'Welcoming',
      'Friendly', 'Familiar', 'Neighbourly', 'Sweet', 'Charming', 'Cute', 'Lovely', 'Pretty',
      'Fluffy', 'Furry', 'Woolly', 'Knitted', 'Rustic', 'Earthy', 'Woody', 'Mossy',
      'Leafy', 'Grassy', 'Flowery', 'Blooming', 'Fruity', 'Sugary', 'Spicy', 'Zesty',
      'Minty', 'Lemony', 'Buttery', 'Crumbly', 'Juicy'
    ],
    // Cheerful and playful (38)
    cheerful: [
      'Cheerful', 'Happy', 'Joyful', 'Jolly', 'Merry', 'Playful', 'Bouncy', 'Bubbly',
      'Giggly', 'Silly', 'Goofy', 'Funny', 'Quirky', 'Whimsical', 'Zany', 'Wacky',
      'Cheeky', 'Festive', 'Celebratory', 'Hopeful', 'Triumphant', 'Victorious', 'Lucky', 'Grateful',
      'Carefree', 'Upbeat', 'Lively', 'Sprightly', 'Perky', 'Peppy', 'Spirited', 'Gleeful',
      'Delightful', 'Colourful', 'Vibrant', 'Vivid', 'Candy', 'Confetti'
    ],
    // Energy and noise (50)
    energy: [
      'Electric', 'Wild', 'Energetic', 'Dynamic', 'Fast', 'Rushing', 'Racing', 'Speedy',
      'Zippy', 'Buzzing', 'Humming', 'Pulsing', 'Throbbing', 'Thumping', 'Booming', 'Roaring',
      'Loud', 'Noisy', 'Busy', 'Bustling', 'Crowded', 'Hectic', 'Chaotic', 'Frantic',
      'Restless', 'Fierce', 'Bold', 'Daring', 'Brave', 'Heroic', 'Epic', 'Mighty',
      'Powerful', 'Strong', 'Tough', 'Rugged', 'Gritty', 'Raw', 'Rough', 'Edgy',
      'Sharp', 'Spiky', 'Jagged', 'Explosive', 'Volcanic', 'Thunderous', 'Turbulent', 'Swirling',
      'Spinning', 'Dizzy'
    ],
    // Mystery and distance (50)
    mystery: [
      'Mysterious', 'Secret', 'Hidden', 'Curious', 'Puzzling', 'Strange', 'Odd', 'Weird',
      'Eerie', 'Spooky', 'Creepy', 'Haunted', 'Ghostly', 'Shadowed', 'Cryptic', 'Enigmatic',
      'Magical', 'Mystic', 'Enchanted', 'Fairytale', 'Mythical', 'Legendary', 'Otherworldly', 'Alien',
      'Cosmic', 'Galactic', 'Celestial', 'Lunar', 'Solar', 'Starry', 'Surreal', 'Uncanny',
      'Spellbound', 'Dreamlike', 'Unknown', 'Lost', 'Forgotten', 'Abandoned', 'Empty', 'Deserted',
      'Lonely', 'Solitary', 'Distant', 'Remote', 'Faraway', 'Isolated', 'Vast', 'Endless',
      'Infinite', 'Boundless'
    ],
    // Gloomy and dramatic (44)
    gloomy: [
      'Gloomy', 'Moody', 'Dark', 'Grey', 'Dreary', 'Drab', 'Dull', 'Sombre',
      'Melancholy', 'Wistful', 'Pensive', 'Thoughtful', 'Brooding', 'Heavy', 'Tired', 'Weary',
      'Sleepless', 'Blue', 'Tearful', 'Grumpy', 'Sulky', 'Stubborn', 'Tense', 'Nervous',
      'Anxious', 'Jittery', 'Suspenseful', 'Dramatic', 'Intense', 'Serious', 'Stern', 'Solemn',
      'Grave', 'Cold', 'Stark', 'Harsh', 'Severe', 'Crumbling', 'Rusty', 'Worn',
      'Weathered', 'Battered', 'Broken', 'Cracked'
    ],
    // Time of day and age (37)
    time: [
      'Nostalgic', 'Vintage', 'Retro', 'Old-school', 'Antique', 'Ancient', 'Timeless', 'Classic',
      'Historic', 'Old', 'Aged', 'Modern', 'Futuristic', 'Sci-fi', 'Brand-new', 'Shiny',
      'Fresh-faced', 'Young', 'Youthful', 'Early', 'Late', 'Midnight', 'Dawn', 'Daybreak',
      'Sunrise', 'Sunset', 'Dusk', 'Evening', 'Morning', 'Noon', 'Afternoon', 'Weekend',
      'Holiday', 'Seasonal', 'Fleeting', 'Momentary', 'Slow-motion'
    ],
    // Size and shape (36)
    scale: [
      'Tiny', 'Little', 'Small', 'Miniature', 'Huge', 'Giant', 'Enormous', 'Massive',
      'Towering', 'Tall', 'Lofty', 'Deep', 'Shallow', 'Wide', 'Narrow', 'Long',
      'Round', 'Square', 'Curvy', 'Twisty', 'Wavy', 'Zigzag', 'Symmetrical', 'Lopsided',
      'Tilted', 'Upside-down', 'Crooked', 'Balanced', 'Layered', 'Tangled', 'Scattered', 'Clustered',
      'Hollow', 'Solid', 'Heavyweight', 'Featherlight'
    ],
    // Texture and surface (35)
    texture: [
      'Smooth', 'Silky', 'Glassy', 'Watery', 'Slippery', 'Sticky', 'Fuzzy', 'Prickly',
      'Thorny', 'Bumpy', 'Lumpy', 'Grainy', 'Gravelly', 'Pebbly', 'Stony', 'Rocky',
      'Craggy', 'Muddy', 'Splashy', 'Foamy', 'Frothy', 'Creamy', 'Milky', 'Chalky',
      'Powdery', 'Crunchy', 'Crackly', 'Papery', 'Leathery', 'Metallic', 'Chrome', 'Steely',
      'Wooden', 'Crystal', 'Transparent'
    ],
    // Place and setting (33)
    place: [
      'Urban', 'Rural', 'Jungle', 'Desert', 'Oceanic', 'Seaside', 'Coastal', 'Riverside',
      'Lakeside', 'Alpine', 'Mountainous', 'Hilly', 'Flat', 'Open', 'Enclosed', 'Industrial',
      'Mechanical', 'Underground', 'Overgrown', 'Sky-high', 'Rooftop', 'Suburban', 'Village', 'Countryside',
      'Farmyard', 'Garden', 'Parkland', 'Woodland', 'Forest', 'Swampy', 'Marshy', 'Island',
      'Harbour'
    ]
  };

  var GROUP_LABEL = {
    light: 'Light and glow',
    weather: 'Weather and air',
    calm: 'Calm and soft',
    cosy: 'Cosy and homely',
    cheerful: 'Cheerful and playful',
    energy: 'Energy and noise',
    mystery: 'Mystery and distance',
    gloomy: 'Gloomy and dramatic',
    time: 'Time of day and age',
    scale: 'Size and shape',
    texture: 'Texture and surface',
    place: 'Place and setting'
  };

  // Build the flat list, dropping duplicates (case-insensitive)
  var LIST = [], GROUP_OF = Object.create(null);
  Object.keys(GROUPS).forEach(function (g) {
    GROUPS[g] = GROUPS[g].filter(function (w) {
      var k = String(w).toLowerCase();
      if (GROUP_OF[k]) return false;
      GROUP_OF[k] = g;
      LIST.push(w);
      return true;
    });
  });

  // Avoid showing the same mood again too soon
  var RECENT_MAX = 24, recent = [];
  function pick() {
    if (!LIST.length) return '';
    var w, guard = 0;
    do { w = LIST[Math.floor(Math.random() * LIST.length)]; guard++; }
    while (recent.indexOf(w) !== -1 && guard < 40);
    recent.push(w);
    if (recent.length > RECENT_MAX) recent.shift();
    return w;
  }

  global.PixMoods = {
    LIST: LIST,
    GROUPS: GROUPS,
    GROUP_LABEL: GROUP_LABEL,
    count: function () { return LIST.length; },
    pick: pick,
    groupOf: function (w) { return GROUP_OF[String(w || '').toLowerCase()] || null; }
  };
})(typeof window !== 'undefined' ? window : this);
