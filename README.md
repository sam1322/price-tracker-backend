<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->
 
---

# Backend – Price Tracker & AI Video Generator

This backend powers two full-stack applications — a **Price Tracker** for Amazon & Flipkart and an **AI Video Generator** platform.
It provides APIs, background jobs, and scalable infrastructure for both projects.

Frontend Repo: [https://github.com/sam1322/price-tracker-frontend](https://github.com/sam1322/price-tracker-frontend)

---

## 🚀 Projects

### 1. Price Tracker – Amazon & Flipkart
🌐 Live Demo: [https://project.sam-tech.xyz/price-tracker](https://project.sam-tech.xyz/price-tracker)

<img width="700" height="500" alt="Create-Next-App-07-24-2025_05_24_PM-2" src="https://github.com/user-attachments/assets/2664af36-090e-46cb-990b-7af924053293" />


A system that scrapes product data, stores price histories, and triggers alerts when user-defined conditions are met.

**Backend Highlights**

* 🔍 Playwright-based scraping for Amazon & Flipkart
* 📈 PostgreSQL + Prisma for historical price tracking
* ⏰ Cron jobs for 6-hour automated updates
* 🔔 Price alert service with notification triggers
* 📊 REST APIs powering analytics & comparison features

---

### 2. AI Video Generator
🌐 Live Demo: [https://project.sam-tech.xyz/ai-video-gen](https://project.sam-tech.xyz/ai-video-gen)

[<img width="900" height="500" alt="Create-Next-App-08-22-2025_12_28_PM" src="https://github.com/user-attachments/assets/508aae14-2a1d-4dbf-bcfa-4ca99626e994" />
](https://youtu.be/CzLBYULWHT8?si=lE2rYyVxGq3x9SSd)


A distributed backend for generating short-form videos from natural prompts using AI and resilient pipelines.

**Backend Highlights**

* ✨ Gemini API integration for AI-driven scripts & scenes
* ⚡ Kafka workers with transactional outbox for fault tolerance
* 🎬 FFmpeg for video composition and rendering
* ☁️ Azure Blob Storage for scalable media storage
* 📡 Async job handling for smooth real-time frontend interaction

---

## 🛠️ Tech Stack

* **Framework**: NestJS with TypeScript
* **Database**: PostgreSQL + Prisma ORM
* **Scraping**: Playwright (Price Tracker)
* **Processing**: Kafka, FFmpeg, Gemini APIs (AI Video Generator)
* **Storage**: Azure Blob Storage
* **Scheduling**: Cron jobs for automated workflows

---

## 📦 Prerequisites

* Node.js 18+
* PostgreSQL 15+
* npm or yarn

---

## 🔧 Setup

```bash
# Clone repo
git clone https://github.com/sam1322/price-tracker-backend.git
cd price-tracker-backend

# Install dependencies
pnpm install  # or use npm or yarn or bun whatever you like 

# Setup environment
cp .env.example .env # for prod env
cp .env.example .env.local # for dev env

# Run migrations
pnpm prisma:migrate:local # for generating tables in local db
pnpm prisma:migrate # for generating tables in prod db

# Generate primsa client
pnpm prisma:generate

# Open DB table
pnpm prisma:studio:local # for opening local database
pnpm prisma:studio # for opening prod database

# Start development server
pnpm run start:dev:local #for running in local env
pnpm run start:dev # for running in prod or dev env
```

---

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
