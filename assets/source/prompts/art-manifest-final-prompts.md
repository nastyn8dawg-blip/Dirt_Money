# Dirt Money Manifest Final-Art Prompts

Use this file with `src/artManifest.js`. Generate concept art first, save it to each asset's `conceptPath`, then promote approved art to `expectedPath`.

Shared negative prompt for every asset: no cartoon, no cozy mobile farming style, no fantasy elements, no neon, no glossy SaaS/dashboard aesthetic, no brand logos, no copyrighted characters, no readable functional UI text baked into the image, no childish flat SVG look.

## Farm Assets

| Asset ID | Target Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `farm.home_overview` | `dm_farm_home_overview.png` | 1920x1080 | Main home farm overview | Rustic painterly realism, rural Americana working farmstead in Ash Creek County, farmhouse, barn, machine shed, gravel drive, fence lines, fields in distance, warm harvest palette, practical farm-business mood, weathered CRPG atmosphere. | Shared negative prompt. | Keep farmhouse, barn, shed, road, and fields readable under dark UI vignette. | No |
| `farm.dashboard_hero` | `dm_farm_dashboard_hero.png` | 1920x1080 | Dashboard hero | Painterly rural farm overview composed for UI overlay, strong central farm silhouette, open darker edges for ledger overlays, warm sky, grounded mature tone. | Shared negative prompt. | Leave darker lower-left/side areas for text. | No |
| `farm.farmhouse` | `dm_farm_farmhouse.png` | 1024x768 | Farmhouse detail | Weathered practical farmhouse, rural Americana, gravel yard, worn porch, working farm not cozy fantasy cottage, warm cream light and dark coffee shadows. | Shared negative prompt. | Subject centered, enough environment for context. | No |
| `farm.barn` | `dm_farm_barn.png` | 1024x768 | Barn detail | Old barn with barn-red paint, weathered boards, working farm wear, warm harvest light, grounded rural realism, practical farm mood. | Shared negative prompt. | Barn should read clearly at card size. | No |
| `farm.machine_shed` | `dm_farm_machine_shed.png` | 1280x720 | Farm machine shed detail | Machine shed with old tractor/combine parts, oil-stained floor, tool bench, steel blue shadows, aged brass highlights, gritty practical repair mood. | Shared negative prompt. | Leave room for UI text overlay. | No |
| `farm.driveway_road` | `dm_farm_driveway_road.png` | 1280x720 | Road/drive scene | Gravel farm driveway meeting rural county road, fence line, dust, fields, warm sky, serious farm-business travel mood. | Shared negative prompt. | Use road as leading line. | No |
| `farm.field_overview` | `dm_farm_field_overview.png` | 1280x720 | Farm fields overview | Wide farm-field overview, multiple field blocks, fence lines, distant barn, weathered rural realism, practical crop-management mood. | Shared negative prompt. | Broad readable field shapes. | No |

## Map Assets

| Asset ID | Target Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `map.ash_creek_county` | `dm_map_ash_creek_county.png` | 1920x1220 | County map background | Worn paper Ash Creek County road map, creek line, county roads, farm blocks, co-op notice-board texture, hand-marked rural Americana mood, warm cream paper and aged brass stains. | Shared negative prompt. | Do not include reliable readable labels; UI provides location names. | No |
| `map.markers` | `dm_map_markers.png` | 512x512 | Optional map marker sheet | Painterly brass-and-barn-red rural map pins, small practical location markers, worn paper-compatible style. | Shared negative prompt. | Transparent or simple background preferred if used later. | No |

## Location Assets

| Asset ID | Target Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `location.home_farm` | `dm_location_home_farm.png` | 1920x1080 | Home Farm hero | Painterly working farmstead, farmhouse, barn, machine shed, fields, gravel lot, warm harvest light, Ash Creek grit. | Shared negative prompt. | Subject readable behind vignette. | No |
| `location.pattis_diner` | `dm_location_pattis_diner.png` | 1920x1080 | Patti's Diner hero | Roadside rural diner, warm windows, gravel lot, coffee counter mood, barn red and cream accents, practical local gathering place. | Shared negative prompt. | Signage may be abstract; game renders name. | No |
| `location.farmers_coop` | `dm_location_farmers_coop.png` | 1920x1080 | Co-op hero | Farmers co-op, seed and fertilizer building, bulk tanks, loading area, dusty yard, county green and harvest gold accents. | Shared negative prompt. | Keep industrial rural forms clear. | No |
| `location.grain_elevator` | `dm_location_grain_elevator.png` | 1920x1080 | Elevator hero | Grain elevator, bins, scale house, grain truck, dusty air, steel blue sky, practical market-pressure mood. | Shared negative prompt. | Tall elevator should remain visible under crop. | No |
| `location.roys_place` | `dm_location_roys_place.png` | 1920x1080 | Roy's repair place | Rural repair shop, open bay, tools, old tractor parts, worn manuals, warm shop light, gritty machine work. | Shared negative prompt. | Strong shop identity. | No |
| `location.guss_yard` | `dm_location_guss_yard.png` | 1920x1080 | Gus's salvage yard | Salvage yard, rows of faded machinery, rust, truck axles, muddy lane, sunset grit, opportunity and risk. | Shared negative prompt. | Deep rows and clear salvage silhouettes. | No |
| `location.hollis_place` | `dm_location_hollis_place.png` | 1920x1080 | Hollis's farm | Neighbor farmstead, weathered barn, tidy fence, older working farm dignity, fields behind, warm rural realism. | Shared negative prompt. | Calm but practical mood. | No |
| `location.bank` | `dm_location_bank.png` | 1920x1080 | Ash Creek Savings | Small-town brick bank or brass-lamp bank interior, old wood, paperwork, serious debt mood, aged brass and cream palette. | Shared negative prompt. | Avoid modern corporate look. | No |
| `location.grange_hall` | `dm_location_grange_hall.png` | 1920x1080 | Grange Hall | Rural meeting hall, notice board, gravel lot, folding-chair community energy, practical county warmth. | Shared negative prompt. | Community without festival cuteness. | No |
| `location.machine_shed` | `dm_location_machine_shed.png` | 1920x1080 | Machine Shed | Farm machine shed, faded combine parts, old row-crop tractor, repair bench, oil cans, dark coffee shadows. | Shared negative prompt. | Useful for equipment screen hero. | No |

## Character Assets

| Asset ID | Target Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `character.old_school` | `dm_character_old_school_portrait.png` | 1024x1365 | Playable background portrait | Older practical farmer, worn cap, work jacket, sun-weathered face, steady field judgment, rural Americana painterly portrait. | Shared negative prompt. | Bust portrait, plain dark rural background. | No |
| `character.it_nephew` | `dm_character_it_nephew_portrait.png` | 1024x1365 | Playable background portrait | Younger practical man, work shirt or hoodie, farm inheritance and data confidence, grounded not parody, steel blue accent. | Shared negative prompt. | Avoid tech-bro caricature. | No |
| `character.mechanic` | `dm_character_mechanic_portrait.png` | 1024x1365 | Playable background portrait | Grease-stained mechanic, sturdy practical build, shop identity, salvage confidence, warm shop light. | Shared negative prompt. | Tool/shop hints allowed. | No |
| `character.patti` | `dm_character_patti_portrait.png` | 1024x1365 | NPC portrait | Patti, rural diner owner/server, warm but sharp, coffee counter light, barn red and cream accents, grounded mature portrait. | Shared negative prompt. | One character only. | No |
| `character.hollis` | `dm_character_hollis_portrait.png` | 1024x1365 | NPC portrait | Hollis, older neighbor farmer, weathered cap, blunt field wisdom, calm dignity, worn jacket, farm background. | Shared negative prompt. | Keep age and role clear. | No |
| `character.marge` | `dm_character_marge_portrait.png` | 1024x1365 | NPC portrait | Marge, farmers co-op manager, practical clipboard confidence, seed-yard background, county green accents. | Shared negative prompt. | Professional rural, not corporate. | No |
| `character.earl` | `dm_character_earl_portrait.png` | 1024x1365 | NPC portrait | Earl, small-town bank loan officer, conservative jacket, brass-lamp paperwork, serious but humane debt pressure. | Shared negative prompt. | Not villainous. | No |
| `character.roy` | `dm_character_roy_portrait.png` | 1024x1365 | NPC portrait | Roy, rural repair mechanic, shop-worn hands, cap, tool wall, steel blue and brass accents. | Shared negative prompt. | Practical machine knowledge. | No |
| `character.gus` | `dm_character_gus_portrait.png` | 1024x1365 | NPC portrait | Gus, salvage yard operator, rough practical look, weathered jacket, rusted equipment background, risk-and-opportunity expression. | Shared negative prompt. | Avoid cartoon junk dealer. | No |
| `character.dee` | `dm_character_dee_portrait.png` | 1024x1365 | NPC portrait | Dee, grain elevator clerk and weather watcher, practical rural professional, scale-ticket desk or elevator background. | Shared negative prompt. | Steel blue weather mood. | No |
| `character.sandy` | `dm_character_sandy_portrait.png` | 1024x1365 | NPC portrait | Sandy, grange/community organizer, capable county presence, notice-board background, warm but direct expression. | Shared negative prompt. | County green accent. | No |

## Field Assets

| Asset ID | Concept Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `field.rough` | `dm_field_rough_v01_concept.png` | 1920x1080 | Rough field visual | Rough uneven bare field, weeds, ruts, tired soil, weathered fence, gritty rural realism, dark walnut earth tones. | Shared negative prompt. | Field condition must read quickly. | No |
| `field.prepped` | `dm_field_prepped_v01_concept.png` | 1920x1080 | Prepped field visual | Freshly worked field rows, clean tilled soil, practical spring preparation, warm cream sky and dark soil. | Shared negative prompt. | Strong row perspective. | No |
| `field.fallow` | `dm_field_fallow_v01_concept.png` | 1920x1080 | Fallow field visual | Resting fallow ground, mixed weeds and cover, uneven rural field, practical soil recovery mood. | Shared negative prompt. | Should not look abandoned. | No |
| `field.harvested` | `dm_field_harvested_v01_concept.png` | 1920x1080 | Harvested field visual | Harvested field, stubble, tire tracks, dusty quiet after work, muted harvest gold and dark walnut palette. | Shared negative prompt. | Stubble and tracks clear. | No |
| `field.corn_planted` | `dm_field_corn_planted_v01_concept.png` | 1920x1080 | Corn planted visual | Newly planted corn ground, straight row marks, damp dark soil, small seed-bed detail, rural working-farm realism. | Shared negative prompt. | Rows should read as corn setup, not generic lawn. | No |
| `field.corn_emerged` | `dm_field_corn_emerged_v01_concept.png` | 1920x1080 | Corn emerged visual | Young corn rows just emerged, small green blades in dark soil, vulnerable early-season field, Ash Creek County palette. | Shared negative prompt. | Corn rows visible but plants still young. | No |
| `field.corn_growing` | `dm_field_corn_growing_v01_concept.png` | 1920x1080 | Corn growing visual | Mid-season corn field, strong green rows, practical rural realism, warm sky, fence edge, businesslike crop-management mood. | Shared negative prompt. | Corn identity unmistakable at card size. | No |
| `field.corn_stressed` | `dm_field_corn_stressed_v01_concept.png` | 1920x1080 | Corn stressed visual | Drought-stressed corn, curled leaves, uneven stand, dusty ground, hot wind mood, barn red warning undertone. | Shared negative prompt. | Stress must be obvious without UI text. | No |
| `field.corn_ready` | `dm_field_corn_ready_v01_concept.png` | 1920x1080 | Ready corn visual | Mature corn field, tall dry stalks, golden ears, urgent harvest readiness, warm rural realism. | Shared negative prompt. | Late-season corn should dominate the scene. | No |
| `field.corn_harvested` | `dm_field_corn_harvested_v01_concept.png` | 1920x1080 | Harvested corn visual | Harvested corn field, chopped stalks, stubble rows, combine tire marks, dusty quiet after work. | Shared negative prompt. | Distinct corn residue and row structure. | No |
| `field.soybeans_planted` | `dm_field_soybeans_planted_v01_concept.png` | 1920x1080 | Soybeans planted visual | Newly planted soybean field, low row texture, damp worked soil, practical spring work, grounded rural realism. | Shared negative prompt. | Keep soybean scale lower than corn. | No |
| `field.soybeans_emerged` | `dm_field_soybeans_emerged_v01_concept.png` | 1920x1080 | Soybeans emerged visual | Small soybean seedlings emerging in rows, paired leaves, dark soil, vulnerable early crop mood. | Shared negative prompt. | Seedling identity should differ from corn. | No |
| `field.soybeans_growing` | `dm_field_soybeans_growing_v01_concept.png` | 1920x1080 | Soybeans growing visual | Healthy soybean canopy, low broad-leaf rows, county green accents, warm realistic farm light. | Shared negative prompt. | Bean field should read lower and denser than corn. | No |
| `field.soybeans_stressed` | `dm_field_soybeans_stressed_v01_concept.png` | 1920x1080 | Soybeans stressed visual | Stressed soybean field, yellowing leaves, thin canopy, dusty patches, weed pressure hints, grounded rural tone. | Shared negative prompt. | Avoid making it look like ready beans. | No |
| `field.soybeans_ready` | `dm_field_soybeans_ready_v01_concept.png` | 1920x1080 | Ready soybean visual | Mature soybean field, dry pods, lower canopy, warm harvest light, grounded farm-business tone. | Shared negative prompt. | Bean field should read distinct from corn. | No |
| `field.soybeans_harvested` | `dm_field_soybeans_harvested_v01_concept.png` | 1920x1080 | Harvested soybean visual | Harvested soybean field, short stubble, fine residue, combine tracks, muted harvest-gold light. | Shared negative prompt. | Lower residue than corn. | No |
| `field.hay_growing` | `dm_field_hay_growing_v01_concept.png` | 1920x1080 | Hay growing visual | Growing hay field, thick grass stand, gentle rows or field texture, warm rural sky, practical neighbor-work mood. | Shared negative prompt. | Hay should read as forage, not grain. | No |
| `field.hay_stressed` | `dm_field_hay_stressed_v01_concept.png` | 1920x1080 | Hay stressed visual | Drought-stressed hay field, patchy thin grass, dusty soil, pale yellow-green tones, serious weather pressure. | Shared negative prompt. | Patchiness and stress visible. | No |
| `field.hay_ready_to_cut` | `dm_field_hay_ready_to_cut_v01_concept.png` | 1920x1080 | Hay ready-to-cut visual | Tall hay field ready to cut, dense grass, warm late-day light, practical harvest timing mood. | Shared negative prompt. | Should feel cuttable, not already cut. | No |
| `field.hay_cut` | `dm_field_hay_cut_v01_concept.png` | 1920x1080 | Cut hay visual | Freshly cut hay lying in rows, drying windrows, warm rural field, practical timing before baling. | Shared negative prompt. | Windrows should be clear. | No |
| `field.hay_baled` | `dm_field_hay_baled_v01_concept.png` | 1920x1080 | Baled hay visual | Hay field with bales, cut stubble, late-day harvest light, grounded rural realism. | Shared negative prompt. | Bales readable but not decorative. | No |
| `field.hay_harvested` | `dm_field_hay_harvested_v01_concept.png` | 1920x1080 | Harvested hay visual | Hay field after pickup, low stubble, tire tracks, clean worked field, quiet post-harvest mood. | Shared negative prompt. | Post-harvest state should read quickly. | No |
| `field.cover_crop_emerged` | `dm_field_cover_crop_emerged_v01_concept.png` | 1920x1080 | Cover crop emerged visual | Low cover crop emergence, small green rows protecting soil, late-season practical conservation mood. | Shared negative prompt. | Should read as cover, not cash crop. | No |
| `field.cover_crop_growing` | `dm_field_cover_crop_growing_v01_concept.png` | 1920x1080 | Cover crop growing visual | Established cover crop field, low dense green growth, soil protection, muted rural light, serious farm-management tone. | Shared negative prompt. | Keep growth low and field-like. | No |
| `field.cover_crop_stressed` | `dm_field_cover_crop_stressed_v01_concept.png` | 1920x1080 | Cover crop stressed visual | Stressed cover crop, patchy green-brown stand, dry soil, uneven growth, practical soil-risk mood. | Shared negative prompt. | Stress should be clear. | No |
| `field.cover_crop_terminated` | `dm_field_cover_crop_terminated_v01_concept.png` | 1920x1080 | Cover crop terminated visual | Terminated cover crop residue on field, flattened plant matter, soil protected, ready for next operation. | Shared negative prompt. | Should not look like failed crop harvest. | No |

## Field Overlay Assets

| Asset ID | Concept Filename | Dimensions | Purpose | Prompt | Avoid | Composition Notes | Bake Text? |
|---|---:|---:|---|---|---|---|---|
| `field_overlay.weeds` | `dm_overlay_weeds_v01_concept.png` | 1920x1080 | Optional weed overlay | Transparent PNG-style overlay of weed pressure, scattered broadleaf weeds and grasses, painterly but readable over field art. | Shared negative prompt; no full opaque background. | Keep center readable and edges natural. | No |
| `field_overlay.drought` | `dm_overlay_drought_v01_concept.png` | 1920x1080 | Optional drought overlay | Transparent PNG-style drought stress overlay, dusty haze, dry cracks, pale heat shimmer accents, rural realism. | Shared negative prompt; no full opaque background. | Should darken/stress art without hiding crop identity. | No |
| `field_overlay.storm_damage` | `dm_overlay_storm_damage_v01_concept.png` | 1920x1080 | Optional storm damage overlay | Transparent PNG-style storm damage overlay, flattened patches, broken stalk accents, wet debris, serious weather-loss mood. | Shared negative prompt; no full opaque background. | Directional damage, readable at small size. | No |
| `field_overlay.wet_muddy` | `dm_overlay_wet_muddy_v01_concept.png` | 1920x1080 | Optional wet muddy overlay | Transparent PNG-style mud and standing-water overlay, wet ruts, darker soil patches, practical field delay mood. | Shared negative prompt; no full opaque background. | Keep water/mud subtle enough for UI legibility. | No |
| `field_overlay.poor_fertility` | `dm_overlay_poor_fertility_v01_concept.png` | 1920x1080 | Optional poor fertility overlay | Transparent PNG-style uneven fertility overlay, pale weak patches, thin growth, muted yellow-green stress cues. | Shared negative prompt; no full opaque background. | Pattern should look agronomic, not decorative. | No |
| `field_overlay.healthy_fertility` | `dm_overlay_healthy_fertility_v01_concept.png` | 1920x1080 | Optional healthy fertility overlay | Transparent PNG-style healthy fertility overlay, richer green bands, subtle vigorous growth accents, grounded farm realism. | Shared negative prompt; no full opaque background. | Positive cue should remain restrained. | No |
