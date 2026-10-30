# SteamLite

Tienda de minijuegos web hecha con **Vite + React**. Explora el catálogo, añade juegos al carrito, simula el pago y juega desde tu biblioteca, todo en el navegador.

## Juegos incluidos

| Juego | Género | Precio | Controles |
|---|---|---|---|
| Salto Guisante | Plataformas | S/ 12.90 | ← → / tocar los lados |
| Entre Tubos | Arcade | S/ 7.50 | Espacio / clic / toque |
| Serpiente | Arcade | S/ 5.90 | Flechas, WASD / deslizar |
| Buscaminas | Lógica | Gratis | Clic, clic derecho / modo bandera |
| 2048 | Lógica | S/ 4.50 | Flechas, WASD / deslizar |

Los juegos de pago se pueden **probar gratis 3 partidas** antes de comprarlos (botón "Probar gratis" en la ficha y en el destacado). Al terminar la prueba aparece la opción de compra.

Para probar el pago usa la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVV.

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
npm run preview  # sirve /dist en local
```

Requiere Node 18 o superior.

## Subir a Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En vercel.com → **Add New → Project** → importa el repositorio.
3. Vercel detecta Vite solo. Deja: Build Command `npm run build`, Output Directory `dist`.
4. **Deploy.**

El archivo `vercel.json` redirige todas las rutas a `index.html`, así que recargar en `/library` o `/play/serpiente` no da error 404.

También puedes desplegar desde la terminal: `npm i -g vercel` y luego `vercel` dentro de la carpeta.

## Requisitos del proyecto y dónde se cumplen

| Requisito | Archivo |
|---|---|
| Vite + React, arquitectura modular | `src/components`, `src/pages`, `src/games` |
| Rutas `/`, `/game/:id`, `/cart`, `/library`, `/play/:id` | `src/App.jsx` |
| Datos en `games.json` cargados con `useEffect` | `public/data/games.json`, `src/hooks/useGames.js` |
| Búsqueda en tiempo real y filtro por género | `src/pages/Home.jsx`, `src/components/FilterBar.jsx` |
| Carrusel destacado | `src/components/HeroCarousel.jsx` |
| Estado global del carrito y subtotales | `src/context/StoreContext.jsx`, `src/pages/Cart.jsx` |
| Formik + Yup (validación de tarjeta con Luhn, vencimiento, CVV…) | `src/components/CheckoutForm.jsx` |
| Biblioteca persistente en `localStorage` | `src/context/StoreContext.jsx`, `src/utils/storage.js` |
| Botón Comprar → En el carrito → Jugar según el estado | `src/components/BuyButton.jsx` |
| Minijuegos en Canvas / JS | `src/games/*` |

## Estructura

```
public/
  data/games.json        catálogo
src/
  components/            Navbar, Footer, HeroCarousel, GameCard, FilterBar, BuyButton, CheckoutForm, GameArt…
  context/StoreContext   carrito + biblioteca (localStorage)
  games/                 SaltoGuisante, EntreTubos, Serpiente, Buscaminas, Game2048
  hooks/useGames.js      carga del catálogo
  pages/                 Home, GameDetail, Cart, Library, Play, NotFound
  styles/global.css      estilos
  utils/                 formato de precios, almacenamiento y récords
```

Todo el arte (pósters y capturas) es SVG generado en código: no hay imágenes externas ni derechos de terceros.
