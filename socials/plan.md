# Instagram Poster Design Plan (Muncheez Socials)

This document outlines the step-by-step design process to create a premium, visually stunning Instagram post (1080x1080 px) using HTML and CSS.

---

## 1. Poster Specifications & Concept
* **Dimensions:** 1080px × 1080px (Instagram Standard Square 1:1 Aspect Ratio).
* **Theme:** "Fast, Premium, and Alive" – showcasing mouth-watering food, quick delivery vibes, and modern UI elements (glassmorphism, glowing gradients, clean layout).
* **Target Audience:** Hungry customers in city hubs looking for quick, high-quality local cuisine.
* **Call to Action (CTA):** "Order Now on Muncheez" / "Get 20% Off Your First Order".

---

## 2. Directory Structure
We will organize our social design workspace in the `socials/` directory:
```text
socials/
├── index.html       # Poster structure
├── style.css        # Premium styling, colors, and layout
├── assets/          # Custom high-quality generated images & logos
└── plan.md          # This planning file
```

---

## 3. Step-by-Step Implementation Plan
1. **Setup Assets:** Use the `generate_image` tool to generate an elite, delicious looking burger, pizza, or food combo on a clean background to act as our hero element.
2. **HTML Structure (`index.html`):**
   - Main container locked at exactly `1080px` by `1080px`.
   - **Background Layer:** Dark premium gradient (e.g., Deep charcoal to electric orange/violet glow).
   - **Header:** Sleek Muncheez logo + "Now Live!" badge.
   - **Hero Section:** Side-by-side or layered layout featuring the generated food image popping out of a 3D circle or card.
   - **Offer Banner:** A glassmorphic card overlay displaying "20% OFF YOUR FIRST ORDER".
   - **Footer:** Download badges (App Store / Play Store mockups) + website URL.
3. **CSS Styling (`style.css`):**
   - Import Google Fonts (e.g., `Outfit` or `Plus Jakarta Sans` for a modern tech feel).
   - Apply absolute centering, flexbox grids, and high-performance gradients.
   - Apply micro-styling (shadows, border-glows, custom shapes).
4. **Rendering & Exporting:**
   - Provide a way to view/preview the HTML file in the browser or compile it to ensure it matches the 1080x1080 layout perfectly.
