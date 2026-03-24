// linkImages.js
// Run this once to link all images to their products in MongoDB

const mongoose = require('mongoose');
const dns      = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Product = require('./models/Product');

// ── Image Map ─────────────────────────────────────────────────
// Maps a keyword match function to an image filename
// Format: { match: (brand, model) => boolean, image: 'filename.webp' }

const imageMap = [

  // ── APPLE ──────────────────────────────────────────────────

  // MacBook Air 2020 M1
  { match: (b, m) => b === 'Apple' && m.includes('2020') && m.includes('M1'),
    image: 'apple_macbook-air-2020-m1.webp' },

  // MacBook Air 2022 M2 256GB (8GB and 16GB)
  { match: (b, m) => b === 'Apple' && m.includes('2022') && m.includes('M2') && m.includes('256GB'),
    image: 'apple_macbook-air-2022-m2-256gb.webp' },

  // MacBook Air 2022 M2 512GB
  { match: (b, m) => b === 'Apple' && m.includes('2022') && m.includes('M2') && m.includes('512GB'),
    image: 'apple_macbook-air-2022-m2-512gb.webp' },

  // MacBook Air 15 2024 M3
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Air 15') && m.includes('2024'),
    image: 'apple_macbook-air-15-2024-m3.webp' },

  // MacBook Air 2024 M3 16GB 1TB (MXCR3HN/A)
  { match: (b, m) => b === 'Apple' && m.includes('MXCR3HN'),
    image: 'apple_macbook-air-2024-m3-16gb-1tb.webp' },

  // MacBook Air 2024 M3 16GB 512GB (MXCT3HN/A)
  { match: (b, m) => b === 'Apple' && m.includes('MXCT3HN'),
    image: 'apple_macbook-air-2024-m3-16gb-512gb.webp' },

  // MacBook Air 2025 M4
  { match: (b, m) => b === 'Apple' && m.includes('2025') && m.includes('M4'),
    image: 'apple_macbook-air-2025-m4.webp' },

  // MacBook Air 2024 M3 8GB 512GB (MRYN3HN/A and MRXW3HN/A)
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Air 2024') && m.includes('M3') && m.includes('8GB'),
    image: 'apple_macbook-air-2024-m3-8gb-512gb.webp' },

  // MacBook Pro 14 2024 M4
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Pro 14') && m.includes('2024') && m.includes('M4'),
    image: 'apple_macbook-pro-14-2024-m4.webp' },

  // MacBook Pro 14 2023 M3 Max
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Pro 14') && m.includes('M3 Max'),
    image: 'apple_macbook-pro-14-2023-m3-max.webp' },

  // MacBook Pro 14 2023 M3 Pro
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Pro 14') && m.includes('M3 Pro'),
    image: 'apple_macbook-pro-14-2023-m3-pro.webp' },

  // MacBook Pro 14 2023 M3 (base)
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Pro 14') && m.includes('M3') && !m.includes('M3 Pro') && !m.includes('M3 Max'),
    image: 'apple_macbook-pro-14-2023-m3.webp' },

  // MacBook Pro 16 2023 M3 (all variants — Max/Pro/base)
  { match: (b, m) => b === 'Apple' && m.includes('MacBook Pro 16'),
    image: 'apple_macbook-pro-16-2023-m3.webp' },

  // ── HP ─────────────────────────────────────────────────────

  { match: (b, m) => b === 'HP' && m.includes('15s-fy5004TU'),
    image: 'hp_15s-fy5004tu.webp' },

  { match: (b, m) => b === 'HP' && m.includes('240 G9'),
    image: 'hp_240-g9.webp' },

  { match: (b, m) => b === 'HP' && m.includes('15s-fq5329TU'),
    image: 'hp_15s-fq5329tu.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fa1132TX'),
    image: 'hp_victus-15-fa1132tx.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Chromebook 11MK'),
    image: 'hp_chromebook-11mk.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fa1312TX'),
    image: 'hp_victus-15-fa1312tx.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fb1002AX'),
    image: 'hp_victus-15-fb1002ax.webp' },

  { match: (b, m) => b === 'HP' && m.includes('255 G10'),
    image: 'hp_255-g10.webp' },

  { match: (b, m) => b === 'HP' && m.includes('14-em0025AU'),
    image: 'hp_14-em0025au.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Envy x360 14'),
    image: 'hp_envy-x360-14.webp' },

  { match: (b, m) => b === 'HP' && m.includes('15s-fr5010TU'),
    image: 'hp_15s-fr5010tu.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-FA1414TX'),
    image: 'hp_victus-15-fa1414tx.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fa0187TX'),
    image: 'hp_victus-15-fa0187tx.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Omen 16'),
    image: 'hp_omen-16.webp' },

  { match: (b, m) => b === 'HP' && m.includes('14-gr1022TU'),
    image: 'hp_14-gr1022tu.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fb0157AX'),
    image: 'hp_victus-15-fb0157ax.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Pavilion x360 14'),
    image: 'hp_pavilion-x360-14.webp' },

  { match: (b, m) => b === 'HP' && m.includes('15-fc0155AU'),
    image: 'hp_15-fc0155au.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fb1015AX'),
    image: 'hp_victus-15-fb1015ax.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Spectre x360 14'),
    image: 'hp_spectre-x360-14.webp' },

  { match: (b, m) => b === 'HP' && m.includes('15-fd0112TU'),
    image: 'hp_15-fd0112tu.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Victus 15-fa1276TX'),
    image: 'hp_victus-15-fa1276tx.webp' },

  { match: (b, m) => b === 'HP' && m.includes('Pavilion Plus 14'),
    image: 'hp_pavilion-plus-14.webp' },

  // ── LENOVO ─────────────────────────────────────────────────

  { match: (b, m) => b === 'Lenovo' && m.includes('Legion 7 16IRX9'),
    image: 'lenovo_legion-7-16irx9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('ThinkBook 15'),
    image: 'lenovo_thinkbook-15-g5.webp' },

  // IdeaPad Slim 5 83DA (both 003GIN and 0043IN variants)
  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad Slim 5') && m.includes('83DA'),
    image: 'lenovo_ideapad-slim-5-83da.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Ideapad 5') && m.includes('14AHP9'),
    image: 'lenovo_ideapad-5-14ahp9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Yoga Slim 7x'),
    image: 'lenovo_ideapad-flex-5.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Yoga Slim 7 14IMH9'),
    image: 'lenovo_ideapad-slim-5-82xf.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad 1 15AMN7'),
    image: 'lenovo_ideapad-1-15amn7.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Legion Pro 7i'),
    image: 'lenovo_legion-pro-7i-2023.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Ideapad Slim 3 15ITL05'),
    image: 'lenovo_ideapad-slim-3-15itl05.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('ThinkPad E14'),
    image: 'lenovo_thinkbook-15-g5.webp' },

  // IdeaPad Gaming 3 Ryzen 5 (5600H and 5500H)
  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad Gaming 3') && (m.includes('5600H') || m.includes('5500H')),
    image: 'lenovo_ideapad-gaming-3-ryzen5.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Yoga Pro 7'),
    image: 'lenovo_ideapad-5-14irh9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad Slim 3 15IAH8'),
    image: 'lenovo_ideapad-slim-3-15iah8.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Yoga Book 9i'),
    image: 'lenovo_ideapad-flex-5.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad 5 14IRH9'),
    image: 'lenovo_ideapad-5-14irh9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Ideapad Gaming 3 15ARH7'),
    image: 'lenovo_ideapad-gaming-3-15arh7.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('LOQ 2024') && m.includes('83GS'),
    image: 'lenovo_loq-15irx9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Ideapad Slim 5 82XF'),
    image: 'lenovo_ideapad-slim-5-82xf.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Thinkpad E15'),
    image: 'lenovo_thinkbook-15-g5.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('IdeaPad Flex 5'),
    image: 'lenovo_ideapad-flex-5.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('LOQ 2024') && m.includes('15AHP9'),
    image: 'lenovo_loq-2024-amd.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('LOQ 15IRX9'),
    image: 'lenovo_loq-15irx9.webp' },

  { match: (b, m) => b === 'Lenovo' && m.includes('Legion Y9000K'),
    image: 'lenovo_legion-y9000k-2024.webp' },

  // ── ASUS ───────────────────────────────────────────────────

  { match: (b, m) => b === 'Asus' && m.includes('Zenbook Duo OLED 2024'),
    image: 'asus_zenbook-duo-oled-2024.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook 15 X1502VA'),
    image: 'asus_vivobook-15-x1502va.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('TUF Gaming A15 FA506NC'),
    image: 'asus_tuf-gaming-a15-fa506nc.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Zenbook 14 OLED 2025'),
    image: 'asus_zenbook-14-oled-2025.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Zenbook 14 OLED 2024'),
    image: 'asus_zenbook-14-oled-2024.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook Go 15'),
    image: 'asus_vivobook-go-15.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook 15 2023') && m.includes('X1504VA'),
    image: 'asus_vivobook-15-x1504va.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('ProArt StudioBook'),
    image: 'asus_proart-studiobook-pro-16.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('TUF Gaming FA401WV'),
    image: 'asus_tuf-gaming-fa401wv.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook S 14 OLED 2025'),
    image: 'asus_vivobook-s14-oled-2025.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('ROG Strix SCAR 16'),
    image: 'asus_rog-strix-scar-16-2025.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Chromebook CX1400'),
    image: 'asus_chromebook-cx1400.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('ROG Zephyrus G16') && m.includes('GU605MI'),
    image: 'asus_rog-zephyrus-g16-gu605mi.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook 15 X1502ZA'),
    image: 'asus_vivobook-15-x1502za.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook S15 K5504VAB'),
    image: 'asus_vivobook-s15-k5504vab.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('ROG Zephyrus G16') && m.includes('GA605WV'),
    image: 'asus_rog-zephyrus-g16-ga605wv.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook 16 X1605VA'),
    image: 'asus_vivobook-16-x1605va.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('TUF Gaming A15 FA506NF'),
    image: 'asus_tuf-gaming-a15-fa506nf.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('Vivobook S15 OLED S5504VA'),
    image: 'asus_vivobook-s15-oled-s5504va.webp' },

  { match: (b, m) => b === 'Asus' && m.includes('VivoBook 15 X1504ZA'),
    image: 'asus_vivobook-15-x1504za.webp' },

  // ── ACER ───────────────────────────────────────────────────

  { match: (b, m) => b === 'Acer' && m.includes('Swift Go 14'),
    image: 'acer_swift-go-14-ai.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Aspire Lite AL15-41') && m.includes('Ryzen 7'),
    image: 'acer_aspire-lite-al15-41-ryzen7.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Aspire 7 A715'),
    image: 'acer_aspire-7-a715.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('One 14 Z8-415'),
    image: 'acer_one-14-z8-415.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Aspire Lite AL15-41') && m.includes('Ryzen 3'),
    image: 'acer_aspire-lite-al15-41-ryzen3.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Aspire Lite AL15-51'),
    image: 'acer_aspire-lite-al15-51.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Aspire Lite') && m.includes('1305U'),
    image: 'acer_aspire-lite-i3-1305u.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('Nitro V ANV15-41'),
    image: 'acer_nitro-v-anv15-41.webp' },

  { match: (b, m) => b === 'Acer' && m.includes('AL15G'),
    image: 'acer_al15g-52-2024.webp' },
];

// ── Main Function ─────────────────────────────────────────────
async function linkImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products\n`);

    let updated   = 0;
    let notFound  = 0;
    const missed  = [];

    for (const product of products) {
      const brand = product.brand;
      const model = product.model;

      // Find matching image
      const match = imageMap.find(entry => entry.match(brand, model));

      if (match) {
        await Product.findByIdAndUpdate(product._id, {
          image: `images/${match.image}`
        });
        console.log(`✅ ${brand} — ${model.slice(0, 50)}...`);
        console.log(`   → images/${match.image}\n`);
        updated++;
      } else {
        console.log(`❌ No image found for: ${brand} — ${model.slice(0, 60)}`);
        missed.push(`${brand}: ${model}`);
        notFound++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated  : ${updated}`);
    console.log(`   ❌ Not found: ${notFound}`);

    if (missed.length > 0) {
      console.log('\n⚠️  Products without images:');
      missed.forEach(m => console.log(`   - ${m}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

linkImages();
