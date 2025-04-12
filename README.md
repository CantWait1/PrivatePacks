# 🧱 Private Packs

Welcome to **Private Packs**, an exclusive platform for sharing, discovering, and managing **private Minecraft texture packs** – for over **500 dedicated members** in the community.

![Private Packs Banner](https://your-image-link.com/banner.png)

## 🚀 Features

- 🎨 **Exclusive Packs**  
  Browse high-quality, hand-picked texture packs not found anywhere else.

- 🧑‍🤝‍🧑 **Community-Driven**  
  Created by players, for players. Feedback and contributions are always welcome!

## 🛠️ Tech Stack

- **Next.js** (Frontend)
- **PostgreSQL + Supabase** (Database & Dev Environment)
- **Prisma** (ORM)
- **Tailwind CSS** (Styling)
- **Authentication** (Secure member login system)

## 🌐 Live Demo

> Coming soon: [www.privatepacks.net](https://www.privatepacks.net)

## 📸 Screenshots

| Home Page | Pack Preview | Filter System |
|----------|--------------|---------------|
| ![](https://your-image-link.com/home.png) | ![](https://your-image-link.com/preview.png) | ![](https://your-image-link.com/filter.png) |

## 🧪 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/CantWait1/PrivatePacks.git

# 2. Push To Database
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate

# 4. Run the development server
npm run dev
