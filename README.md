# Canopy — Personal Environmental Intelligence

![Canopy Banner](./assets/banner-placeholder.png) <!-- Replace with actual screenshot -->

Canopy is a world-class, premium personal environmental operating system. It goes beyond simple carbon footprint calculation by providing deep, personalized insights, stunning visual storytelling, and a dynamic "Earth Twin" that responds in real-time to your lifestyle choices.

Built specifically with the Indian context in mind (using Indian emission baselines), Canopy aims to help users visualize their impact and take actionable steps towards a greener future.

## ✨ Features

- **Premium Interface**: A stunning, glassmorphic UI inspired by modern design leaders (Apple, Linear, Arc).
- **Interactive Carbon Calculator**: Adjust your daily habits across 6 categories (Transport, Food, Energy, Shopping, Waste, Water) with immediate visual feedback.
- **Dynamic Earth Twin**: A beautiful, multi-layered Canvas 2D visualization of the Earth that degrades or heals based on your carbon score. Features include twinkling stars, dynamic atmosphere, pollution particles, and aurora effects.
- **Global Impact Simulator**: Visualizes the macro-scale impact—"If everyone lived like you"—showing equivalent Earths needed, temperature rise, and sea-level changes.
- **Spotify-style Wrapped Cards**: Beautifully animated summary cards showing your weekly performance and money saved.
- **Deep Analytics**: Flow charts, heatmaps, and future projection scenarios based on your tracked data.
- **Simulate Changes**: Adjust sliders to see how small lifestyle changes (e.g., taking the metro, eating less meat) will impact your footprint over 1 to 5 years.

## 🛠 Tech Stack

Canopy is built for extreme performance and lightweight delivery, using zero heavy UI frameworks:
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Graphics**: HTML5 Canvas API (custom multi-layer rendering engine)
- **Styling**: Custom CSS Design System (Fluid typography, CSS variables, advanced keyframe animations)
- **Tooling**: Vite (for local development and bundling)
- **Storage**: LocalStorage API (for persistent, zero-backend user profiles)

## 🚀 Installation & Setup

Since Canopy relies on standard Web APIs and Vite, setup is incredibly fast.

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/canopy.git
   cd canopy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`*

4. **Build for production**
   ```bash
   npm run build
   ```
   *The optimized static files will be generated in the `dist/` folder.*

## 🔒 Environment Variables

This application is primarily frontend-driven. However, if you plan to integrate external APIs (like actual Google Auth via Firebase or external footprint databases), use the `.env` file.

Create a `.env` file in the root directory based on the `.env.example`:

```bash
cp .env.example .env
```

## 📸 Screenshots

| Dashboard | Earth Twin |
| :---: | :---: |
| ![Dashboard](./assets/dash-placeholder.png) | ![Earth Twin](./assets/earth-placeholder.png) |
| *Premium dashboard with live calculator* | *Dynamic canvas-rendered Earth* |

| Analytics | Simulator |
| :---: | :---: |
| ![Analytics](./assets/analytics-placeholder.png) | ![Simulator](./assets/sim-placeholder.png) |
| *Deep insights and heatmaps* | *Future impact simulation* |

*(Note: Replace placeholders in the `assets/` folder with actual screenshots before publishing)*

## 📂 Project Structure

```text
├── index.html          # Main application shell
├── src/
│   ├── js/
│   │   └── app.js      # Core application logic and Canvas engine
│   └── css/
│       └── styles.css  # Premium design system and animations
├── assets/             # Images, icons, and fonts
├── package.json        # Project metadata and scripts
├── .env.example        # Example environment variables
└── README.md           # This file
```

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the Earth visualization, add new footprint categories, or integrate a backend:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
