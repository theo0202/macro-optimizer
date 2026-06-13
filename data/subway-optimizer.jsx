import { useState, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// COMPLETE SUBWAY NUTRITIONAL DATA (Jan 2026 UK & ROI)
// All values per single serving (6" sub portions)
// For footlong: multiply by 2
// ═══════════════════════════════════════════════════════════════

const NUTRITION_DATA = {
  breads: [
    { id: "hearty_italian", name: "Hearty Italian", servingG: 75, kcal: 206, fat: 2.2, sat: 0.4, carbs: 39, sugars: 4.3, fibre: 2, protein: 7.4, salt: 0.6 },
    { id: "honey_oat", name: "Honey & Oat", servingG: 85, kcal: 192, fat: 1.5, sat: 0.2, carbs: 33, sugars: 4.7, fibre: 5, protein: 8.6, salt: 0.56 },
    { id: "herbs_cheese", name: "Italian Herbs & Cheese", servingG: 101, kcal: 283, fat: 6, sat: 4, carbs: 44, sugars: 5, fibre: 3, protein: 12, salt: 0.7 },
    { id: "italian_white", name: "Italian White", servingG: 70, kcal: 190, fat: 2.1, sat: 0, carbs: 36, sugars: 4.2, fibre: 2.1, protein: 7, salt: 0.6 },
    { id: "wholegrain", name: "Wholegrain", servingG: 76, kcal: 157, fat: 0.8, sat: 0.2, carbs: 27, sugars: 1.4, fibre: 4.4, protein: 7.5, salt: 0.56 },
    { id: "gluten_free", name: "Gluten-Free", servingG: 110, kcal: 294, fat: 6.6, sat: 0.6, carbs: 53, sugars: 1.2, fibre: 3.7, protein: 3.3, salt: 1.0 },
  ],

  proteins: [
    { id: "roast_chicken", name: "Roast Chicken Breast", servingG: 71, kcal: 85, fat: 1, sat: 0.5, carbs: 1, sugars: 1.4, fibre: 0, protein: 16, salt: 0.9 },
    { id: "chicken_tikka", name: "Chicken Tikka", servingG: 71, kcal: 89, fat: 1.4, sat: 0.4, carbs: 2, sugars: 0.9, fibre: 0, protein: 18, salt: 0.6 },
    { id: "rotisserie_chicken", name: "Rotisserie-Style Chicken", servingG: 56, kcal: 71, fat: 2, sat: 0.3, carbs: 0, sugars: 0.1, fibre: 0, protein: 12, salt: 0.5 },
    { id: "breaded_chicken", name: "Breaded Chicken", servingG: 85, kcal: 176, fat: 7, sat: 1, carbs: 14.3, sugars: 2.7, fibre: 0.7, protein: 14, salt: 0.8 },
    { id: "ham", name: "Ham", servingG: 28, kcal: 34, fat: 1, sat: 0.3, carbs: 1, sugars: 0.4, fibre: 0.3, protein: 5, salt: 0.5 },
    { id: "turkey", name: "Turkey Breast", servingG: 38, kcal: 38, fat: 0.6, sat: 0.1, carbs: 0, sugars: 0.4, fibre: 0.2, protein: 8, salt: 0.6 },
    { id: "bacon", name: "Bacon (Streaky)", servingG: 9, kcal: 37, fat: 2.8, sat: 1, carbs: 0, sugars: 0.3, fibre: 0, protein: 3, salt: 0.3 },
    { id: "meatball_marinara", name: "Meatball Marinara", servingG: 137, kcal: 193, fat: 10, sat: 3.1, carbs: 10, sugars: 6.4, fibre: 2.9, protein: 13, salt: 1 },
    { id: "philly_steak", name: "Philly Steak", servingG: 71, kcal: 86, fat: 1.4, sat: 0.4, carbs: 8, sugars: 3.9, fibre: 0.7, protein: 11, salt: 0.7 },
    { id: "tuna_mayo", name: "Tuna (Lite Mayo)", servingG: 74, kcal: 145, fat: 10, sat: 0.9, carbs: 2, sugars: 1, fibre: 0, protein: 12, salt: 0.9 },
    { id: "spiced_plant", name: "Spiced Plant Patty", servingG: 85, kcal: 169, fat: 9, sat: 0.8, carbs: 10, sugars: 1.6, fibre: 2.7, protein: 11, salt: 1 },
    { id: "lincolnshire_sausage", name: "Lincolnshire Sausage", servingG: 50, kcal: 121, fat: 9, sat: 3, carbs: 3, sugars: 0.3, fibre: 0.5, protein: 7, salt: 0.7 },
    { id: "falafel", name: "Falafel Bites", servingG: 90, kcal: 226, fat: 13, sat: 1.1, carbs: 26, sugars: 1.4, fibre: 12, protein: 6.5, salt: 1.2 },
    { id: "pepperoni_main", name: "Pepperoni", servingG: 18, kcal: 73, fat: 6.3, sat: 2.2, carbs: 1, sugars: 0, fibre: 0, protein: 3.6, salt: 0.7 },
    { id: "salami_main", name: "Salami", servingG: 18, kcal: 73, fat: 6.3, sat: 2.3, carbs: 1, sugars: 0, fibre: 0, protein: 4, salt: 0.7 },
  ],

  cheeses: [
    { id: "none", name: "No Cheese", servingG: 0, kcal: 0, fat: 0, sat: 0, carbs: 0, sugars: 0, fibre: 0, protein: 0, salt: 0 },
    { id: "american", name: "American-style Cheese", servingG: 12, kcal: 42, fat: 3.5, sat: 2.2, carbs: 0.4, sugars: 0.4, fibre: 0, protein: 2.3, salt: 0.3 },
    { id: "mozzarella_cheddar", name: "Mozzarella & Cheddar", servingG: 14, kcal: 45, fat: 3.4, sat: 2.2, carbs: 0.6, sugars: 0.1, fibre: 0, protein: 3.2, salt: 0.2 },
    { id: "vegan_cheeze", name: "Vegan CheeZe", servingG: 10, kcal: 30, fat: 2.4, sat: 2.1, carbs: 1.9, sugars: 0, fibre: 0, protein: 0, salt: 0.1 },
  ],

  extras: [
    { id: "turkey_rashers", name: "Turkey Rashers", servingG: 19, kcal: 29, fat: 1, sat: 0.3, carbs: 0, sugars: 0, fibre: 0, protein: 4.8, salt: 0.4 },
    { id: "pepperoni_extra", name: "Pepperoni", servingG: 18, kcal: 73, fat: 6.3, sat: 2.2, carbs: 1, sugars: 0, fibre: 0, protein: 3.6, salt: 0.7 },
    { id: "hash_browns", name: "Hash Browns", servingG: 111, kcal: 184, fat: 11, sat: 0.8, carbs: 22, sugars: 1.1, fibre: 2.3, protein: 2.4, salt: 0.8 },
    { id: "chicken_strips", name: "Chicken Strips", servingG: 71, kcal: 85, fat: 1, sat: 0.5, carbs: 1, sugars: 1.4, fibre: 0, protein: 16, salt: 0.9 },
    { id: "turkey_ham", name: "Turkey Ham", servingG: 28, kcal: 29, fat: 1.1, sat: 0.4, carbs: 0, sugars: 0.1, fibre: 0.1, protein: 3.9, salt: 0.5 },
    { id: "poached_egg", name: "Poached Egg", servingG: 50, kcal: 62, fat: 3.6, sat: 1.2, carbs: 0.9, sugars: 0.2, fibre: 0.4, protein: 6.5, salt: 0.2 },
    { id: "salami_extra", name: "Salami", servingG: 18, kcal: 73, fat: 6.3, sat: 2.3, carbs: 1, sugars: 0, fibre: 0, protein: 4, salt: 0.7 },
    { id: "breaded_chicken_extra", name: "Breaded Chicken", servingG: 85, kcal: 176, fat: 7, sat: 1, carbs: 14.3, sugars: 2.7, fibre: 0.7, protein: 14, salt: 0.8 },
    { id: "smashed_falafel", name: "Smashed Falafel", servingG: 90, kcal: 226, fat: 13, sat: 1.1, carbs: 26, sugars: 1.4, fibre: 12, protein: 6.5, salt: 1.2 },
    { id: "philly_steak_extra", name: "Philly-Style Steak", servingG: 71, kcal: 86, fat: 1.4, sat: 0.4, carbs: 8, sugars: 3.9, fibre: 0.7, protein: 11, salt: 0.7 },
    { id: "chicken_tikka_extra", name: "Chicken Tikka", servingG: 71, kcal: 89, fat: 1.4, sat: 0.4, carbs: 2, sugars: 0.9, fibre: 0, protein: 18, salt: 0.6 },
  ],

  salads: [
    { id: "lettuce", name: "Lettuce", servingG: 14, kcal: 2, fat: 0, sat: 0, carbs: 0.2, sugars: 0.2, fibre: 0.2, protein: 0.2, salt: 0 },
    { id: "tomatoes", name: "Tomatoes", servingG: 30, kcal: 5, fat: 0, sat: 0, carbs: 0.8, sugars: 0.8, fibre: 0.4, protein: 0.3, salt: 0 },
    { id: "cucumber", name: "Cucumber", servingG: 18, kcal: 3, fat: 0, sat: 0, carbs: 0.6, sugars: 0.3, fibre: 0.1, protein: 0.1, salt: 0 },
    { id: "pickles", name: "Pickles", servingG: 7.5, kcal: 1, fat: 0, sat: 0, carbs: 0.1, sugars: 0, fibre: 0.1, protein: 0, salt: 0.2 },
    { id: "peppers", name: "Peppers", servingG: 12, kcal: 3, fat: 0, sat: 0, carbs: 0.5, sugars: 0.3, fibre: 0.2, protein: 0.1, salt: 0 },
    { id: "olives", name: "Olives", servingG: 3, kcal: 3, fat: 0, sat: 0, carbs: 0, sugars: 0, fibre: 0.1, protein: 0, salt: 0.1 },
    { id: "red_onions", name: "Red Onions", servingG: 7, kcal: 3, fat: 0, sat: 0, carbs: 0.6, sugars: 0.4, fibre: 0.1, protein: 0.1, salt: 0 },
    { id: "jalapenos", name: "Jalapeños", servingG: 7, kcal: 1, fat: 0, sat: 0, carbs: 0.1, sugars: 0.1, fibre: 0.1, protein: 0, salt: 0.3 },
    { id: "sweetcorn", name: "Sweetcorn", servingG: 7, kcal: 6, fat: 0, sat: 0, carbs: 0.8, sugars: 0.4, fibre: 0.3, protein: 0.2, salt: 0 },
  ],

  sauces: [
    { id: "sweet_chilli", name: "Sweet Chilli", servingG: 14, kcal: 30, fat: 0, sat: 0, carbs: 7.5, sugars: 6.5, fibre: 0, protein: 0, salt: 0.2 },
    { id: "chipotle_sw", name: "Chipotle Southwest", servingG: 14, kcal: 58, fat: 5.8, sat: 0.4, carbs: 1.2, sugars: 0.6, fibre: 0.1, protein: 0.1, salt: 0.2 },
    { id: "sweet_onion", name: "Sweet Onion", servingG: 14, kcal: 23, fat: 0.1, sat: 0, carbs: 5.6, sugars: 4.8, fibre: 0.1, protein: 0.1, salt: 0.1 },
    { id: "honey_mustard", name: "Honey Mustard", servingG: 14, kcal: 29, fat: 1.9, sat: 0.1, carbs: 2.7, sugars: 2.3, fibre: 0.2, protein: 0.3, salt: 0.2 },
    { id: "ketchup", name: "Ketchup", servingG: 14, kcal: 14, fat: 0, sat: 0, carbs: 3.2, sugars: 3.2, fibre: 0, protein: 0.2, salt: 0.3 },
    { id: "xspy_chipotle", name: "X-Spy Chipotle", servingG: 14, kcal: 60, fat: 6.1, sat: 0.5, carbs: 1.1, sugars: 0.7, fibre: 0.1, protein: 0.2, salt: 0.3 },
    { id: "garlic_herb", name: "Garlic & Herb", servingG: 14, kcal: 80, fat: 8.4, sat: 0.6, carbs: 0.9, sugars: 0.4, fibre: 0, protein: 0, salt: 0.1 },
    { id: "teriyaki", name: "Teriyaki", servingG: 14, kcal: 24, fat: 0, sat: 0, carbs: 5.6, sugars: 4.1, fibre: 0, protein: 0.4, salt: 0.5 },
    { id: "lite_mayo", name: "Lite Mayo", servingG: 14, kcal: 46, fat: 4.9, sat: 0.3, carbs: 0.6, sugars: 0.6, fibre: 0, protein: 0, salt: 0.2 },
    { id: "bbq", name: "BBQ Sauce", servingG: 14, kcal: 24, fat: 0.1, sat: 0, carbs: 5.8, sugars: 5.2, fibre: 0.1, protein: 0.1, salt: 0.2 },
  ],

  seasonings: [
    { id: "sea_salt", name: "Sea Salt", servingG: 1, kcal: 0, fat: 0, sat: 0, carbs: 0, sugars: 0, fibre: 0, protein: 0, salt: 0.4 },
    { id: "mixed_pepper", name: "Mixed Peppercorns", servingG: 1, kcal: 3, fat: 0, sat: 0, carbs: 0.4, sugars: 0, fibre: 0.2, protein: 0.1, salt: 0 },
    { id: "crispy_onions", name: "Crispy Onions", servingG: 7, kcal: 41, fat: 3, sat: 1, carbs: 2.9, sugars: 0.6, fibre: 0.3, protein: 0.4, salt: 0 },
  ],

  // ── Full sub data for reference / future features ──
  subs_6inch: [
    { id: "sub_bacon", name: "Bacon", category: "subs", kcal: 306, fat: 11, sat: 4.2, carbs: 37, sugars: 5.1, fibre: 2.3, protein: 16, salt: 1.5 },
    { id: "sub_poached_egg_cheese", name: "Poached Egg & Cheese", category: "subs", kcal: 294, fat: 9.1, sat: 3.4, carbs: 37, sugars: 4.7, fibre: 2.5, protein: 16, salt: 1 },
    { id: "sub_linc_sausage", name: "Lincolnshire Sausage", category: "subs", kcal: 353, fat: 15, sat: 5.6, carbs: 39, sugars: 4.8, fibre: 2.6, protein: 16, salt: 1.6 },
    { id: "sub_linc_saus_bacon", name: "Lincolnshire Sausage & Bacon", category: "subs", kcal: 446, fat: 21, sat: 8.7, carbs: 43, sugars: 8.7, fibre: 2.7, protein: 22, salt: 2.4 },
    { id: "sub_big_breakwich", name: "Big Breakwich", category: "subs", kcal: 599, fat: 30, sat: 10, carbs: 55, sugars: 9.4, fibre: 4.2, protein: 30, salt: 3 },
    { id: "sub_breaded_chicken_bacon", name: "Breaded Chicken w/ Bacon Special", category: "subs", kcal: 574, fat: 24, sat: 7.5, carbs: 61, sugars: 14, fibre: 4, protein: 30, salt: 2.6 },
    { id: "sub_breaded_chicken", name: "Breaded Chicken", category: "subs", kcal: 423, fat: 12, sat: 3.3, carbs: 53, sugars: 9.3, fibre: 3.8, protein: 25, salt: 1.7 },
    { id: "sub_chicken_breast", name: "Chicken Breast", category: "subs", kcal: 340, fat: 6.8, sat: 3.1, carbs: 42, sugars: 7, fibre: 2.4, protein: 26, salt: 1.8 },
    { id: "sub_chicken_tikka", name: "Chicken Tikka", category: "subs", kcal: 345, fat: 7.1, sat: 2.9, carbs: 43, sugars: 6.4, fibre: 3.5, protein: 28, salt: 1.5 },
    { id: "sub_furious_chicken", name: "Furious Chicken", category: "subs", kcal: 520, fat: 24, sat: 5.8, carbs: 49, sugars: 7.2, fibre: 4.5, protein: 26, salt: 2.5 },
    { id: "sub_rotisserie", name: "Rotisserie Style Chicken", category: "subs", kcal: 310, fat: 7.6, sat: 2.5, carbs: 38, sugars: 5.6, fibre: 2.5, protein: 22, salt: 1.4 },
    { id: "sub_tex_mexan", name: "Tex Mexan", category: "subs", kcal: 386, fat: 23, sat: 6.2, carbs: 18, sugars: 7.5, fibre: 3.8, protein: 26, salt: 2.1 },
    { id: "sub_honey_bbq_chk_bacon", name: "Honey Mustard BBQ Chicken & Bacon", category: "subs", kcal: 430, fat: 15, sat: 5.7, carbs: 44, sugars: 12, fibre: 3.5, protein: 28, salt: 2.4 },
    { id: "sub_meatball", name: "Meatball Marinara", category: "subs", kcal: 447, fat: 16, sat: 5.7, carbs: 51, sugars: 12, fibre: 5.2, protein: 23, salt: 1.9 },
    { id: "sub_philly", name: "Philly Steak", category: "subs", kcal: 297, fat: 3.6, sat: 0.8, carbs: 48, sugars: 8.9, fibre: 3, protein: 18, salt: 1.3 },
    { id: "sub_garlic_cheesesteak", name: "Garlic Cheesesteak", category: "subs", kcal: 539, fat: 27, sat: 6.7, carbs: 51, sugars: 12, fibre: 4.1, protein: 24, salt: 2.2 },
    { id: "sub_ham", name: "Ham", category: "subs", kcal: 324, fat: 7.9, sat: 3.2, carbs: 42, sugars: 6.4, fibre: 3, protein: 21, salt: 1.8 },
    { id: "sub_turkey", name: "Turkey", category: "subs", kcal: 312, fat: 6.6, sat: 2.8, carbs: 41, sugars: 6.1, fibre: 2.7, protein: 22, salt: 1.8 },
    { id: "sub_ham_turkey", name: "Ham & Turkey", category: "subs", kcal: 327, fat: 7.4, sat: 3, carbs: 42, sugars: 6.3, fibre: 2.9, protein: 23, salt: 2 },
    { id: "sub_spicy_italian", name: "Spicy Italian", category: "subs", kcal: 498, fat: 27, sat: 10, carbs: 43, sugars: 5.7, fibre: 2.7, protein: 22, salt: 3.2 },
    { id: "sub_italian_bmt", name: "Italian B.M.T", category: "subs", kcal: 386, fat: 16, sat: 5.2, carbs: 41, sugars: 4.8, fibre: 2.5, protein: 20, salt: 2.5 },
    { id: "sub_veggie_delite", name: "Veggie Delite", category: "subs", kcal: 227, fat: 2.4, sat: 0.5, carbs: 42, sugars: 6.6, fibre: 3.2, protein: 8.3, salt: 0.6 },
    { id: "sub_falafel", name: "Falafel", category: "subs", kcal: 360, fat: 12, sat: 2.7, carbs: 52, sugars: 7.2, fibre: 8.8, protein: 13, salt: 1.5 },
    { id: "sub_tuna", name: "Tuna Mayonnaise", category: "subs", kcal: 400, fat: 16, sat: 3.4, carbs: 43, sugars: 6.6, fibre: 2.4, protein: 22, salt: 1.8 },
    { id: "sub_plant_patty", name: "Spiced Plant Patty", category: "subs", kcal: 424, fat: 14, sat: 3.4, carbs: 51, sugars: 7.2, fibre: 5.1, protein: 21, salt: 2 },
  ],

  toasties: [
    { id: "toast_honey_mustard", name: "Honey Mustard Deli Toastie", kcal: 362, fat: 12, sat: 4.8, carbs: 41, sugars: 8.5, fibre: 3, protein: 21, salt: 2.1 },
    { id: "toast_bacon_cheese", name: "Bacon & Cheese Toastie", kcal: 487, fat: 24, sat: 10, carbs: 43, sugars: 11, fibre: 2.6, protein: 27, salt: 3 },
    { id: "toast_big_cheesesteak", name: "Big Cheesesteak Toastie", kcal: 458, fat: 18, sat: 6.6, carbs: 48, sugars: 11, fibre: 3.3, protein: 26, salt: 2 },
    { id: "toast_triple_cheese", name: "Triple Cheese", kcal: 345, fat: 13, sat: 6.5, carbs: 44, sugars: 11, fibre: 2.5, protein: 14, salt: 1.5 },
    { id: "toast_bbq_chk_bacon", name: "BBQ Chicken & Bacon Toastie", kcal: 410, fat: 14, sat: 5.6, carbs: 43, sugars: 10, fibre: 2.8, protein: 27, salt: 2.4 },
  ],

  saver_subs: [
    { id: "saver_nacho_chicken", name: "Nacho Chicken", kcal: 423, fat: 17, sat: 3.4, carbs: 49, sugars: 7, fibre: 3.5, protein: 18, salt: 1.9 },
    { id: "saver_ham_cheese", name: "Ham & Cheese", kcal: 380, fat: 16, sat: 5.2, carbs: 39, sugars: 6.3, fibre: 2.7, protein: 20, salt: 2.1 },
    { id: "saver_blt", name: "BLT", kcal: 317, fat: 13, sat: 2.4, carbs: 38, sugars: 6.3, fibre: 2.9, protein: 14, salt: 1.5 },
  ],

  wraps: [
    { id: "wrap_big_breakwich", name: "Big Breakwich Wrap", kcal: 685, fat: 33, sat: 11, carbs: 67, sugars: 7.8, fibre: 6, protein: 29, salt: 3.6 },
    { id: "wrap_chicken_breast", name: "Chicken Breast Wrap", kcal: 410, fat: 10, sat: 3.4, carbs: 51, sugars: 5.3, fibre: 4.3, protein: 25, salt: 2.3 },
    { id: "wrap_chicken_tikka", name: "Chicken Tikka Wrap", kcal: 414, fat: 11, sat: 3.3, carbs: 51, sugars: 4.7, fibre: 5.4, protein: 27, salt: 2.1 },
  ],

  salad_meals: [
    { id: "salad_chicken_breast", name: "Chicken Breast Salad", kcal: 148, fat: 4.7, sat: 2.7, carbs: 5.3, sugars: 4.4, fibre: 1.7, protein: 20, salt: 1.2 },
    { id: "salad_chicken_tikka", name: "Chicken Tikka Salad", kcal: 152, fat: 5.1, sat: 2.6, carbs: 5.6, sugars: 3.8, fibre: 2.7, protein: 22, salt: 1 },
    { id: "salad_big_bombay", name: "Big Bombay Salad", kcal: 282, fat: 15, sat: 5.2, carbs: 13, sugars: 11, fibre: 3.2, protein: 24, salt: 1.7 },
  ],

  spuds: [
    { id: "spud_butter_cheese", name: "Butter & Cheese", kcal: 413, fat: 17, sat: 9.9, carbs: 51, sugars: 2, fibre: 7.4, protein: 14, salt: 0.7 },
    { id: "spud_cheese_beans", name: "Cheese & Beans", kcal: 522, fat: 17, sat: 9.9, carbs: 69, sugars: 8.6, fibre: 13, protein: 21, salt: 1.6 },
    { id: "spud_philly", name: "Philly Cheese Steak", kcal: 499, fat: 18, sat: 10, carbs: 59, sugars: 5.9, fibre: 8.1, protein: 25, salt: 1.4 },
    { id: "spud_tuna", name: "Tuna Mayo & Cheese", kcal: 558, fat: 27, sat: 11, carbs: 54, sugars: 3, fibre: 7.4, protein: 26, salt: 1.6 },
    { id: "spud_bmt", name: "B.M.T & Cheese", kcal: 561, fat: 27, sat: 13, carbs: 53, sugars: 2.6, fibre: 8, protein: 27, salt: 2.3 },
  ],

  sides: [
    { id: "waffle_fries_reg", name: "Waffle Fries (Regular)", kcal: 184, fat: 8.2, sat: 1.1, carbs: 23, sugars: 0.3, fibre: 4, protein: 2.8, salt: 0.9 },
    { id: "waffle_fries_lg", name: "Waffle Fries (Large)", kcal: 276, fat: 12, sat: 1.7, carbs: 34, sugars: 0.5, fibre: 6, protein: 4.2, salt: 1.3 },
    { id: "hash_browns_side", name: "Hash Browns (6pc)", kcal: 184, fat: 11, sat: 0.8, carbs: 22, sugars: 1.1, fibre: 2.3, protein: 2.4, salt: 0.8 },
    { id: "nacho_bites_6", name: "Nacho Chicken Bites (6pc)", kcal: 270, fat: 13, sat: 1.8, carbs: 21, sugars: 1, fibre: 1.5, protein: 16, salt: 1.5 },
    { id: "nacho_bites_9", name: "Nacho Chicken Bites (9pc)", kcal: 405, fat: 19, sat: 2.7, carbs: 32, sugars: 1.4, fibre: 2.3, protein: 24, salt: 2.2 },
  ],

  cookies: [
    { id: "cookie_choc_chunk", name: "Chocolate Chunk Cookie", kcal: 214, fat: 10, sat: 5.1, carbs: 28, sugars: 16, fibre: 1.2, protein: 2.3, salt: 0.3 },
    { id: "cookie_footlong_choc", name: "Footlong Choc Chip Cookie", kcal: 1344, fat: 68, sat: 33, carbs: 164, sugars: 94, fibre: 6, protein: 15, salt: 1.7 },
    { id: "cookie_rainbow", name: "Rainbow Cookie", kcal: 214, fat: 9.8, sat: 5, carbs: 28, sugars: 18, fibre: 2, protein: 2, salt: 0.1 },
    { id: "cookie_vegan_choc", name: "Vegan Double Choc Cookie", kcal: 220, fat: 11, sat: 6, carbs: 27, sugars: 17, fibre: 2, protein: 2, salt: 0.3 },
    { id: "cookie_macadamia", name: "White Macadamia Nut Cookie", kcal: 215, fat: 10, sat: 5, carbs: 27, sugars: 16, fibre: 1, protein: 2.3, salt: 0.4 },
  ],
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const sumNutrition = (items, multiplier = 1) => {
  const base = { kcal: 0, fat: 0, sat: 0, carbs: 0, sugars: 0, fibre: 0, protein: 0, salt: 0 };
  items.forEach(item => {
    if (!item) return;
    Object.keys(base).forEach(k => { base[k] += (item[k] || 0); });
  });
  Object.keys(base).forEach(k => { base[k] = Math.round(base[k] * multiplier * 10) / 10; });
  return base;
};

const computeScore = (actual, targets, mode, preferences) => {
  let score = 0;
  if (mode === "macros") {
    if (targets.protein > 0) score += Math.abs(actual.protein - targets.protein) / Math.max(targets.protein, 1) * 3;
    if (targets.carbs > 0) score += Math.abs(actual.carbs - targets.carbs) / Math.max(targets.carbs, 1) * 2;
    if (targets.fat > 0) score += Math.abs(actual.fat - targets.fat) / Math.max(targets.fat, 1) * 2;
  } else {
    if (targets.kcal > 0) score += Math.abs(actual.kcal - targets.kcal) / Math.max(targets.kcal, 1) * 4;
    const pRatio = actual.protein * 4 / Math.max(actual.kcal, 1);
    const cRatio = actual.carbs * 4 / Math.max(actual.kcal, 1);
    const fRatio = actual.fat * 9 / Math.max(actual.kcal, 1);
    if (preferences.highProtein) score -= pRatio * 2;
    if (preferences.lowProtein) score += pRatio * 1.5;
    if (preferences.highCarb) score -= cRatio * 1.5;
    if (preferences.lowCarb) score += cRatio * 2;
    if (preferences.highFat) score -= fRatio * 1.5;
    if (preferences.lowFat) score += fRatio * 2;
  }
  // Fibre/salt constraints
  if (targets.fibreMin != null && actual.fibre < targets.fibreMin) score += (targets.fibreMin - actual.fibre) * 0.5;
  if (targets.fibreMax != null && actual.fibre > targets.fibreMax) score += (actual.fibre - targets.fibreMax) * 0.5;
  if (targets.saltMin != null && actual.salt < targets.saltMin) score += (targets.saltMin - actual.salt) * 0.3;
  if (targets.saltMax != null && actual.salt > targets.saltMax) score += (actual.salt - targets.saltMax) * 0.3;
  return score;
};

// ═══════════════════════════════════════════════════════════════
// OPTIMIZER
// ═══════════════════════════════════════════════════════════════

const optimize = (targets, mode, preferences, noSauce, noCheese, subSize) => {
  const mult = subSize === "footlong" ? 2 : 1;
  const { breads, proteins, cheeses, extras, sauces } = NUTRITION_DATA;
  const cheeseOptions = noCheese ? cheeses.filter(c => c.id === "none") : cheeses;
  const results = [];

  for (const bread of breads) {
    for (const prot of proteins) {
      for (const cheese of cheeseOptions) {
        const baseItems = [bread, prot, cheese];
        const baseNut = sumNutrition(baseItems, mult);
        const baseScore = computeScore(baseNut, targets, mode, preferences);

        results.push({
          bread, protein: prot, cheese,
          extras: [], sauces: [],
          nutrition: baseNut,
          score: baseScore,
        });

        // Try adding up to 2 extras
        for (let i = 0; i < extras.length; i++) {
          const nut1 = sumNutrition([...baseItems, extras[i]], mult);
          const s1 = computeScore(nut1, targets, mode, preferences);
          if (s1 < baseScore + 0.5) {
            results.push({
              bread, protein: prot, cheese,
              extras: [extras[i]], sauces: [],
              nutrition: nut1, score: s1,
            });
          }
          for (let j = i + 1; j < extras.length; j++) {
            const nut2 = sumNutrition([...baseItems, extras[i], extras[j]], mult);
            const s2 = computeScore(nut2, targets, mode, preferences);
            if (s2 < baseScore + 0.3) {
              results.push({
                bread, protein: prot, cheese,
                extras: [extras[i], extras[j]], sauces: [],
                nutrition: nut2, score: s2,
              });
            }
          }
        }

        // Try adding sauces for top base combos
        if (!noSauce && baseScore < 3) {
          for (const sauce of sauces) {
            const nutS = sumNutrition([...baseItems, sauce], mult);
            results.push({
              bread, protein: prot, cheese,
              extras: [], sauces: [sauce],
              nutrition: nutS,
              score: computeScore(nutS, targets, mode, preferences),
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, 20);
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

const MacroBar = ({ label, value, target, color, unit = "g" }) => {
  const pct = target > 0 ? Math.min((value / target) * 100, 150) : 0;
  const diff = target > 0 ? value - target : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#b0b0b0", marginBottom: 2 }}>
        <span>{label}</span>
        <span>
          <span style={{ color: "#fff", fontWeight: 600 }}>{value}{unit}</span>
          {target > 0 && <span style={{ color: diff > 0 ? "#ff6b6b" : "#51cf66", marginLeft: 4 }}>({diff > 0 ? "+" : ""}{Math.round(diff)}{unit})</span>}
        </span>
      </div>
      {target > 0 && (
        <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(pct, 100)}%`, background: color,
            borderRadius: 2, transition: "width 0.4s ease",
          }} />
        </div>
      )}
    </div>
  );
};

const Chip = ({ label, active, onClick, small }) => (
  <button onClick={onClick} style={{
    padding: small ? "3px 8px" : "5px 12px",
    borderRadius: 6,
    border: `1px solid ${active ? "#009743" : "#3a3a3a"}`,
    background: active ? "rgba(0,151,67,0.15)" : "transparent",
    color: active ? "#4ade80" : "#999",
    fontSize: small ? 10 : 11,
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    transition: "all 0.15s ease",
  }}>
    {label}
  </button>
);

const NumberInput = ({ label, value, onChange, placeholder, unit, min = 0 }) => (
  <div style={{ flex: 1, minWidth: 80 }}>
    <label style={{ display: "block", fontSize: 10, color: "#777", marginBottom: 3, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        min={min}
        style={{
          width: "100%", padding: "8px 10px", paddingRight: unit ? 28 : 10,
          background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
          color: "#fff", fontSize: 14, fontFamily: "'DM Mono', monospace",
          outline: "none", boxSizing: "border-box",
        }}
      />
      {unit && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#555" }}>{unit}</span>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function SubwayOptimizer() {
  // Mode
  const [mode, setMode] = useState("macros"); // "macros" | "calories"
  const [subSize, setSubSize] = useState("six"); // "six" | "footlong"

  // Macro targets
  const [targetProtein, setTargetProtein] = useState(30);
  const [targetCarbs, setTargetCarbs] = useState(45);
  const [targetFat, setTargetFat] = useState(12);

  // Calorie target
  const [targetKcal, setTargetKcal] = useState(450);

  // Preferences (calorie mode)
  const [prefs, setPrefs] = useState({
    highProtein: true, lowProtein: false,
    highCarb: false, lowCarb: false,
    highFat: false, lowFat: true,
  });

  // Optional constraints
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fibreMin, setFibreMin] = useState("");
  const [fibreMax, setFibreMax] = useState("");
  const [saltMin, setSaltMin] = useState("");
  const [saltMax, setSaltMax] = useState("");
  const [noSauce, setNoSauce] = useState(false);
  const [noCheese, setNoCheese] = useState(false);

  // Manual customization
  const [selectedResult, setSelectedResult] = useState(null);
  const [manualSalads, setManualSalads] = useState({});
  const [manualSauces, setManualSauces] = useState({});
  const [manualSeasonings, setManualSeasonings] = useState({});
  const [manualExtras, setManualExtras] = useState({});

  const togglePref = (key) => {
    const opposites = { highProtein: "lowProtein", lowProtein: "highProtein", highCarb: "lowCarb", lowCarb: "highCarb", highFat: "lowFat", lowFat: "highFat" };
    setPrefs(p => ({ ...p, [key]: !p[key], ...(p[key] ? {} : { [opposites[key]]: false }) }));
  };

  const targets = useMemo(() => {
    const t = { protein: 0, carbs: 0, fat: 0, kcal: 0, fibreMin: null, fibreMax: null, saltMin: null, saltMax: null };
    if (mode === "macros") {
      t.protein = targetProtein || 0;
      t.carbs = targetCarbs || 0;
      t.fat = targetFat || 0;
      t.kcal = t.protein * 4 + t.carbs * 4 + t.fat * 9;
    } else {
      t.kcal = targetKcal || 0;
    }
    if (fibreMin !== "") t.fibreMin = Number(fibreMin);
    if (fibreMax !== "") t.fibreMax = Number(fibreMax);
    if (saltMin !== "") t.saltMin = Number(saltMin);
    if (saltMax !== "") t.saltMax = Number(saltMax);
    return t;
  }, [mode, targetProtein, targetCarbs, targetFat, targetKcal, fibreMin, fibreMax, saltMin, saltMax]);

  const results = useMemo(() => {
    return optimize(targets, mode, prefs, noSauce, noCheese, subSize);
  }, [targets, mode, prefs, noSauce, noCheese, subSize]);

  // Compute total nutrition for selected result + manual additions
  const selectedTotal = useMemo(() => {
    if (!selectedResult) return null;
    const mult = subSize === "footlong" ? 2 : 1;
    const items = [selectedResult.bread, selectedResult.protein, selectedResult.cheese, ...selectedResult.extras, ...selectedResult.sauces];

    // Double meat = add protein again
    if (manualExtras["__double_meat"]) items.push(selectedResult.protein);
    // Double cheese = add cheese again
    if (manualExtras["__double_cheese"] && selectedResult.cheese.id !== "none") items.push(selectedResult.cheese);

    // Add manual extras (excluding special keys)
    NUTRITION_DATA.extras.forEach(e => { if (manualExtras[e.id]) items.push(e); });
    NUTRITION_DATA.salads.forEach(s => { if (manualSalads[s.id]) items.push(s); });
    NUTRITION_DATA.sauces.forEach(s => { if (manualSauces[s.id]) items.push(s); });
    NUTRITION_DATA.seasonings.forEach(s => { if (manualSeasonings[s.id]) items.push(s); });

    return sumNutrition(items, mult);
  }, [selectedResult, manualSalads, manualSauces, manualSeasonings, manualExtras, subSize]);

  const autoKcal = mode === "macros" ? (targetProtein || 0) * 4 + (targetCarbs || 0) * 4 + (targetFat || 0) * 9 : targetKcal;

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d0d", color: "#e0e0e0",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: "0 0 40px 0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #009743 0%, #006b30 100%)",
        padding: "20px 20px 16px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
          SUBWAY UK&nbsp;·&nbsp;JAN 2026
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
          Macro Optimizer
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
          Finde die optimale Bestellung für deine Ziele
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Size Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["six", "6 Inch"], ["footlong", "Footlong"]].map(([val, label]) => (
            <button key={val} onClick={() => setSubSize(val)} style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: subSize === val ? "1px solid #009743" : "1px solid #2a2a2a",
              background: subSize === val ? "rgba(0,151,67,0.1)" : "#151515",
              color: subSize === val ? "#4ade80" : "#888",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["macros", "Makros eingeben"], ["calories", "Kalorien + Präferenzen"]].map(([val, label]) => (
            <button key={val} onClick={() => setMode(val)} style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: mode === val ? "1px solid #009743" : "1px solid #2a2a2a",
              background: mode === val ? "rgba(0,151,67,0.1)" : "#151515",
              color: mode === val ? "#4ade80" : "#888",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div style={{ background: "#151515", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #222" }}>
          {mode === "macros" ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <NumberInput label="Protein" value={targetProtein} onChange={setTargetProtein} placeholder="30" unit="g" />
                <NumberInput label="Carbs" value={targetCarbs} onChange={setTargetCarbs} placeholder="45" unit="g" />
                <NumberInput label="Fat" value={targetFat} onChange={setTargetFat} placeholder="12" unit="g" />
              </div>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>
                ≈ {autoKcal} kcal
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <NumberInput label="Kalorien-Ziel" value={targetKcal} onChange={setTargetKcal} placeholder="450" unit="kcal" />
              </div>
              <div style={{ fontSize: 10, color: "#666", marginBottom: 8, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                Makro-Präferenzen
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  ["highProtein", "High Protein"], ["lowProtein", "Low Protein"],
                  ["highCarb", "High Carb"], ["lowCarb", "Low Carb"],
                  ["highFat", "High Fat"], ["lowFat", "Low Fat"],
                ].map(([key, label]) => (
                  <Chip key={key} label={label} active={prefs[key]} onClick={() => togglePref(key)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* No Sauce + Advanced */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#999" }}>
            <input type="checkbox" checked={noCheese} onChange={e => setNoCheese(e.target.checked)}
              style={{ accentColor: "#009743", width: 16, height: 16 }} />
            Kein Käse
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#999" }}>
            <input type="checkbox" checked={noSauce} onChange={e => setNoSauce(e.target.checked)}
              style={{ accentColor: "#009743", width: 16, height: 16 }} />
            Keine Sauce
          </label>
          <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
            background: "none", border: "none", color: "#666", fontSize: 11, cursor: "pointer",
            fontFamily: "'DM Mono', monospace", textDecoration: "underline",
          }}>
            {showAdvanced ? "Weniger ▴" : "Fibre / Salt ▾"}
          </button>
        </div>

        {showAdvanced && (
          <div style={{ background: "#151515", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #222" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <NumberInput label="Fibre Min" value={fibreMin} onChange={setFibreMin} placeholder="–" unit="g" />
              <NumberInput label="Fibre Max" value={fibreMax} onChange={setFibreMax} placeholder="–" unit="g" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <NumberInput label="Salt Min" value={saltMin} onChange={setSaltMin} placeholder="–" unit="g" />
              <NumberInput label="Salt Max" value={saltMax} onChange={setSaltMax} placeholder="–" unit="g" />
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          Top Ergebnisse
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {results.slice(0, 8).map((r, i) => {
            const isSelected = selectedResult === r;
            return (
              <button key={i} onClick={() => {
                setSelectedResult(isSelected ? null : r);
                setManualSalads({}); setManualSauces({}); setManualSeasonings({}); setManualExtras({});
              }} style={{
                background: isSelected ? "rgba(0,151,67,0.08)" : "#151515",
                border: isSelected ? "1px solid #009743" : "1px solid #222",
                borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s ease",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                      {r.protein.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#777", fontFamily: "'DM Mono', monospace" }}>
                      {r.bread.name}
                      {r.cheese.id !== "none" && ` · ${r.cheese.name}`}
                      {r.extras.length > 0 && ` · +${r.extras.map(e => e.name).join(", +")}`}
                      {r.sauces.length > 0 && ` · ${r.sauces.map(s => s.name).join(", ")}`}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: "#4ade80",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {r.nutrition.kcal}
                    <span style={{ fontSize: 9, color: "#666", fontWeight: 400 }}> kcal</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ color: "#60a5fa" }}>P {r.nutrition.protein}g</span>
                  <span style={{ color: "#fbbf24" }}>C {r.nutrition.carbs}g</span>
                  <span style={{ color: "#f87171" }}>F {r.nutrition.fat}g</span>
                  <span style={{ color: "#a78bfa" }}>Fib {r.nutrition.fibre}g</span>
                  <span style={{ color: "#999" }}>Salt {r.nutrition.salt}g</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail / Customization Panel */}
        {selectedResult && selectedTotal && (
          <div style={{ background: "#151515", borderRadius: 12, border: "1px solid #009743", padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {selectedResult.protein.name}
            </div>
            <div style={{ fontSize: 11, color: "#777", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
              {selectedResult.bread.name} · {subSize === "footlong" ? "Footlong" : "6 Inch"}
              {selectedResult.cheese.id !== "none" && ` · ${selectedResult.cheese.name}`}
            </div>

            {/* Macro Bars */}
            <div style={{ marginBottom: 16 }}>
              <MacroBar label="Kalorien" value={selectedTotal.kcal} target={mode === "macros" ? autoKcal : targetKcal} color="#4ade80" unit=" kcal" />
              <MacroBar label="Protein" value={selectedTotal.protein} target={mode === "macros" ? targetProtein : 0} color="#60a5fa" />
              <MacroBar label="Carbs" value={selectedTotal.carbs} target={mode === "macros" ? targetCarbs : 0} color="#fbbf24" />
              <MacroBar label="Fat" value={selectedTotal.fat} target={mode === "macros" ? targetFat : 0} color="#f87171" />
              <MacroBar label="Fibre" value={selectedTotal.fibre} target={fibreMin !== "" ? Number(fibreMin) : 0} color="#a78bfa" />
              <MacroBar label="Salt" value={selectedTotal.salt} target={saltMax !== "" ? Number(saltMax) : 0} color="#94a3b8" />
            </div>

            {/* Additional Extras */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                + Extras hinzufügen
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {NUTRITION_DATA.extras.filter(e => !selectedResult.extras.find(x => x.id === e.id)).map(e => (
                  <Chip key={e.id} label={`${e.name} (+${e.kcal})`} small
                    active={!!manualExtras[e.id]}
                    onClick={() => setManualExtras(p => ({ ...p, [e.id]: !p[e.id] }))} />
                ))}
                {/* Double Meat / Double Cheese */}
                <Chip label={`Double Meat (+${selectedResult.protein.kcal * (subSize === "footlong" ? 2 : 1)})`} small
                  active={!!manualExtras["__double_meat"]}
                  onClick={() => setManualExtras(p => ({ ...p, "__double_meat": !p["__double_meat"] }))} />
                {selectedResult.cheese.id !== "none" && (
                  <Chip label={`Double Cheese (+${selectedResult.cheese.kcal * (subSize === "footlong" ? 2 : 1)})`} small
                    active={!!manualExtras["__double_cheese"]}
                    onClick={() => setManualExtras(p => ({ ...p, "__double_cheese": !p["__double_cheese"] }))} />
                )}
              </div>
            </div>

            {/* Salad */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                  Salad
                </div>
                <button onClick={() => {
                  const standard = {};
                  NUTRITION_DATA.salads.forEach(s => {
                    if (!["jalapenos", "sweetcorn", "olives"].includes(s.id)) standard[s.id] = true;
                  });
                  setManualSalads(standard);
                }} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: "#009743", border: "none",
                  color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: 0.3,
                }}>
                  ✦ Mein Standard
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {NUTRITION_DATA.salads.map(s => (
                  <Chip key={s.id} label={s.name} small
                    active={!!manualSalads[s.id]}
                    onClick={() => setManualSalads(p => ({ ...p, [s.id]: !p[s.id] }))} />
                ))}
              </div>
            </div>

            {/* Sauces */}
            {!noSauce && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  Saucen (max 2)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {NUTRITION_DATA.sauces.filter(s => !selectedResult.sauces.find(x => x.id === s.id)).map(s => {
                    const activeCount = Object.values(manualSauces).filter(Boolean).length + selectedResult.sauces.length;
                    const isActive = !!manualSauces[s.id];
                    return (
                      <Chip key={s.id} label={s.name} small
                        active={isActive}
                        onClick={() => {
                          if (!isActive && activeCount >= 2) return;
                          setManualSauces(p => ({ ...p, [s.id]: !p[s.id] }));
                        }} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seasonings */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Seasonings
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {NUTRITION_DATA.seasonings.map(s => (
                  <Chip key={s.id} label={`${s.name} (+${s.kcal})`} small
                    active={!!manualSeasonings[s.id]}
                    onClick={() => setManualSeasonings(p => ({ ...p, [s.id]: !p[s.id] }))} />
                ))}
              </div>
            </div>

            {/* ── Deliveroo Bestellanleitung ── */}
            {(() => {
              const allExtras = [
                ...(selectedResult.extras || []),
                ...NUTRITION_DATA.extras.filter(e => manualExtras[e.id]),
              ];
              const allSauces = [
                ...(selectedResult.sauces || []),
                ...NUTRITION_DATA.sauces.filter(s => manualSauces[s.id]),
              ];
              const allSalads = NUTRITION_DATA.salads.filter(s => manualSalads[s.id]);
              const allSeasonings = NUTRITION_DATA.seasonings.filter(s => manualSeasonings[s.id]);
              const doubleMeat = !!manualExtras["__double_meat"];
              const doubleCheese = !!manualExtras["__double_cheese"];

              const steps = [
                { label: "Sub", value: selectedResult.protein.name },
                { label: "Größe", value: subSize === "footlong" ? "Footlong" : "6 Inch" },
                { label: "Brot", value: selectedResult.bread.name },
                { label: "Käse", value: selectedResult.cheese.id === "none" ? "Kein Käse" : selectedResult.cheese.name },
                { label: "Extras", value: [
                  doubleMeat && "Double Meat",
                  doubleCheese && "Double Cheese",
                  ...allExtras.map(e => e.name),
                ].filter(Boolean).join(", ") || "–" },
                { label: "Salad", value: allSalads.map(s => s.name).join(", ") || "–" },
                { label: "Sauce", value: noSauce ? "Keine" : (allSauces.map(s => s.name).join(", ") || "–") },
                { label: "Seasonings", value: allSeasonings.map(s => s.name).join(", ") || "–" },
              ];

              return (
                <div style={{
                  background: "#0d0d0d", borderRadius: 8, padding: 14,
                  border: "1px solid #2a2a2a",
                }}>
                  <div style={{
                    fontSize: 10, color: "#009743", fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase", letterSpacing: 2, marginBottom: 10,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 13 }}>📋</span> Bestellanleitung (Deliveroo)
                  </div>
                  {steps.map((step, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, alignItems: "baseline",
                      padding: "5px 0",
                      borderBottom: i < steps.length - 1 ? "1px solid #1a1a1a" : "none",
                    }}>
                      <span style={{
                        fontSize: 9, color: "#555", fontFamily: "'DM Mono', monospace",
                        minWidth: 16, textAlign: "right",
                      }}>
                        {i + 1}.
                      </span>
                      <span style={{
                        fontSize: 10, color: "#777", fontFamily: "'DM Mono', monospace",
                        minWidth: 72,
                      }}>
                        {step.label}
                      </span>
                      <span style={{
                        fontSize: 12, color: "#e0e0e0", fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {step.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 20, fontSize: 9, color: "#444", fontFamily: "'DM Mono', monospace", lineHeight: 1.5, textAlign: "center" }}>
          Daten: Subway UK & ROI Jan 2026 · Double Meat addiert den gleichen Proteinwert nochmals
        </div>
      </div>
    </div>
  );
}
